const fs = require('fs');
const path = require('path');
const mascotasFilePath = path.join(__dirname, '../../mascotas.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(mascotasFilePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(mascotasFilePath, JSON.stringify(data, null, 2), 'utf8');
}

exports.getMascotas = (req, res) => {
  const { search, especie, torre } = req.query;
  let items = readData();
  if (especie) items = items.filter(m => m.especie === especie);
  if (torre) items = items.filter(m => String(m.torre) === String(torre));
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(m =>
      m.nombre.toLowerCase().includes(q) ||
      m.raza.toLowerCase().includes(q) ||
      m.apto.includes(q) ||
      m.propietario.toLowerCase().includes(q)
    );
  }
  res.json(items);
};

exports.createMascota = (req, res) => {
  const { nombre, especie, raza, apto, torre, propietario, telefono, color, vacunaAntirrabica, fechaVacuna, manejoEspecial, polizaResponsabilidad, observaciones } = req.body;
  if (!nombre || !apto || !torre) return res.status(400).json({ error: 'Nombre, torre y apartamento son obligatorios' });
  const items = readData();
  const nueva = {
    id: 'pet-' + Date.now(),
    nombre,
    especie: especie || 'perro',
    raza: raza || 'Mestizo',
    apto: String(apto),
    torre: String(torre),
    propietario: propietario || 'Residente',
    telefono: telefono || '',
    color: color || '',
    vacunaAntirrabica: vacunaAntirrabica !== false,
    fechaVacuna: fechaVacuna || new Date().toISOString().split('T')[0],
    manejoEspecial: Boolean(manejoEspecial),
    polizaResponsabilidad: polizaResponsabilidad || '',
    qrToken: 'PET-' + nombre.toUpperCase() + '-' + apto + '-T' + torre,
    observaciones: observaciones || ''
  };
  items.unshift(nueva);
  writeData(items);
  res.status(201).json(nueva);
};

exports.updateMascota = (req, res) => {
  const { id } = req.params;
  const items = readData();
  const idx = items.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Mascota no encontrada' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeData(items);
  res.json(items[idx]);
};

exports.deleteMascota = (req, res) => {
  const { id } = req.params;
  let items = readData();
  items = items.filter(m => m.id !== id);
  writeData(items);
  res.json({ message: 'Mascota eliminada del censo' });
};
