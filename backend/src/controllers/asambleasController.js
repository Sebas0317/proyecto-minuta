const fs = require('fs');
const path = require('path');
const asambleasFilePath = path.join(__dirname, '../../asambleas.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(asambleasFilePath, 'utf8'));
  } catch (e) {
    return { asambleas: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(asambleasFilePath, JSON.stringify(data, null, 2), 'utf8');
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

  if (opcion === 'si') vot.votosSi = Number((vot.votosSi + peso).toFixed(2));
  else if (opcion === 'no') vot.votosNo = Number((vot.votosNo + peso).toFixed(2));
  else vot.votosBlanco = Number((vot.votosBlanco + peso).toFixed(2));

  vot.totalVotado = Number((vot.votosSi + vot.votosNo + vot.votosBlanco).toFixed(2));
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
