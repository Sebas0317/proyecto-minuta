const fs = require('fs');
const path = require('path');
const equiposFilePath = path.join(__dirname, '../../equipos_emergencia.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(equiposFilePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(equiposFilePath, JSON.stringify(data, null, 2), 'utf8');
}

exports.getEquipos = (req, res) => {
  const { torre, tipo } = req.query;
  let items = readData();
  if (torre) items = items.filter(e => String(e.torre) === String(torre));
  if (tipo) items = items.filter(e => e.tipo === tipo);
  res.json(items);
};

exports.createEquipo = (req, res) => {
  const { tipo, nombre, ubicacion, torre, piso, capacidad, agente, fechaRecarga, fechaVencimiento, observaciones } = req.body;
  if (!nombre || !ubicacion) return res.status(400).json({ error: 'Nombre y ubicación son obligatorios' });
  const items = readData();
  const nuevo = {
    id: 'eq-' + Date.now(),
    tipo: tipo || 'extintor',
    nombre,
    ubicacion,
    torre: torre || '1',
    piso: Number(piso) || 1,
    capacidad: capacidad || '20 Lbs',
    agente: agente || 'PQS',
    fechaRecarga: fechaRecarga || new Date().toISOString().split('T')[0],
    fechaVencimiento: fechaVencimiento || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
    estado: 'operativo',
    observaciones: observaciones || ''
  };
  items.push(nuevo);
  writeData(items);
  res.status(201).json(nuevo);
};

exports.updateEquipo = (req, res) => {
  const { id } = req.params;
  const items = readData();
  const idx = items.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Equipo no encontrado' });
  items[idx] = { ...items[idx], ...req.body, id };
  writeData(items);
  res.json(items[idx]);
};

exports.deleteEquipo = (req, res) => {
  const { id } = req.params;
  let items = readData();
  items = items.filter(e => e.id !== id);
  writeData(items);
  res.json({ message: 'Equipo eliminado' });
};
