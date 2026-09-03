const fs = require('fs');
const path = require('path');
const asambleasFilePath = path.join(__dirname, '../../asambleas.json');

function readData() {
  try {
    const raw = JSON.parse(fs.readFileSync(asambleasFilePath, 'utf8'));
    if (Array.isArray(raw)) return { asambleas: raw };
    return raw && Array.isArray(raw.asambleas) ? raw : { asambleas: [] };
  } catch (e) {
    return { asambleas: [] };
  }
}

function writeData(data) {
  const toSave = Array.isArray(data) ? data : (data.asambleas || []);
  fs.writeFileSync(asambleasFilePath, JSON.stringify(toSave, null, 2), 'utf8');
}

exports.getAsambleas = (req, res) => {
  const data = readData();
  res.json(data.asambleas || []);
};

exports.createAsamblea = (req, res) => {
  const { titulo, fecha, horaInicio, totalCoeficiente } = req.body;
  if (!titulo) return res.status(400).json({ error: 'El título de la asamblea es obligatorio' });
  const data = readData();
  const nueva = {
    id: 'asmb-' + Date.now(),
    titulo,
    fecha: fecha || new Date().toISOString().split('T')[0],
    horaInicio: horaInicio || '08:00 AM',
    estado: 'en_curso',
    totalCoeficiente: Number(totalCoeficiente) || 100.0,
    quorumRegistrado: 0.0,
    votaciones: []
  };
  data.asambleas.unshift(nueva);
  writeData(data);
  res.status(201).json(nueva);
};

exports.updateQuorum = (req, res) => {
  const { id } = req.params;
  const { quorumRegistrado } = req.body;
  const data = readData();
  const asmb = data.asambleas.find(a => a.id === id);
  if (!asmb) return res.status(404).json({ error: 'Asamblea no encontrada' });
  asmb.quorumRegistrado = Number(quorumRegistrado) || 0;
  writeData(data);
  res.json(asmb);
};

exports.addVotacion = (req, res) => {
  const { id } = req.params;
  const { pregunta } = req.body;
  if (!pregunta) return res.status(400).json({ error: 'La pregunta es obligatoria' });
  const data = readData();
  const asmb = data.asambleas.find(a => a.id === id);
  if (!asmb) return res.status(404).json({ error: 'Asamblea no encontrada' });
  const nuevaVot = {
    id: 'vot-' + Date.now(),
    pregunta,
    estado: 'activa',
    votosSi: 0,
    votosNo: 0,
    votosBlanco: 0,
    totalVotado: 0
  };
  asmb.votaciones.push(nuevaVot);
  writeData(data);
  res.status(201).json(nuevaVot);
};

exports.castVote = (req, res) => {
  const { id, votId } = req.params;
  const { opcion, coeficiente } = req.body; // 'si', 'no', 'blanco'
  const peso = Number(coeficiente) || 1.0;
  const data = readData();
  const asmb = data.asambleas.find(a => a.id === id);
  if (!asmb) return res.status(404).json({ error: 'Asamblea no encontrada' });
  const vot = (asmb.votaciones || []).find(v => v.id === votId);
  if (!vot) return res.status(404).json({ error: 'Votación no encontrada' });
  if (vot.estado === 'cerrada') return res.status(400).json({ error: 'La votación ya está cerrada' });

  if (!vot.opciones) {
    vot.opciones = { si: Number(vot.votosSi) || 0, no: Number(vot.votosNo) || 0, blanco: Number(vot.votosBlanco) || 0 };
  }

  if (opcion === 'si') {
    vot.votosSi = Number(((Number(vot.votosSi) || Number(vot.opciones.si) || 0) + peso).toFixed(2));
    vot.opciones.si = vot.votosSi;
  } else if (opcion === 'no') {
    vot.votosNo = Number(((Number(vot.votosNo) || Number(vot.opciones.no) || 0) + peso).toFixed(2));
    vot.opciones.no = vot.votosNo;
  } else {
    vot.votosBlanco = Number(((Number(vot.votosBlanco) || Number(vot.opciones.blanco) || 0) + peso).toFixed(2));
    vot.opciones.blanco = vot.votosBlanco;
  }

  const si = Number(vot.opciones.si) || 0;
  const no = Number(vot.opciones.no) || 0;
  const blanco = Number(vot.opciones.blanco) || 0;
  vot.totalVotado = Number((si + no + blanco).toFixed(2));

  writeData(data);
  res.json(vot);
};

exports.closeVotacion = (req, res) => {
  const { id, votId } = req.params;
  const data = readData();
  const asmb = data.asambleas.find(a => a.id === id);
  if (!asmb) return res.status(404).json({ error: 'Asamblea no encontrada' });
  const vot = (asmb.votaciones || []).find(v => v.id === votId);
  if (!vot) return res.status(404).json({ error: 'Votación no encontrada' });
  vot.estado = 'cerrada';
  vot.resultado = vot.votosSi > vot.votosNo ? 'APROBADA' : 'RECHAZADA';
  writeData(data);
  res.json(vot);
};
