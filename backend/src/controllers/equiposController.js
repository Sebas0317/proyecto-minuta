'use strict';

const persistence = require('../data/persistence');
const { logger } = require('../utils/logger');

exports.getEquipos = async (req, res) => {
  try {
    const { torre, tipo } = req.query;
    const raw = await persistence.getEquipos();
    let items = Array.isArray(raw) ? [...raw] : [];
    if (torre) items = items.filter((e) => String(e.torre || '') === String(torre));
    if (tipo) items = items.filter((e) => e.tipo === tipo);
    res.json(items);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener equipos de emergencia');
    res.status(500).json({ error: 'Error interno al obtener equipos de emergencia' });
  }
};

exports.createEquipo = async (req, res) => {
  try {
    const { tipo, nombre, ubicacion, torre, piso, capacidad, agente, fechaRecarga, fechaVencimiento, observaciones } = req.body;
    if (!nombre || !ubicacion) {
      return res.status(400).json({ error: 'Nombre y ubicación son obligatorios' });
    }
    const raw = await persistence.getEquipos();
    const items = Array.isArray(raw) ? [...raw] : [];
    const nuevo = {
      id: 'eq-' + Date.now(),
      tipo: tipo || 'extintor',
      nombre: String(nombre).trim(),
      ubicacion: String(ubicacion).trim(),
      torre: String(torre || '1'),
      piso: Number(piso) || 1,
      capacidad: capacidad || '20 Lbs',
      agente: agente || 'PQS',
      fechaRecarga: fechaRecarga || new Date().toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estado: 'operativo',
      observaciones: observaciones || ''
    };
    items.push(nuevo);
    await persistence.setEquipos(items);
    res.status(201).json(nuevo);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar equipo de emergencia');
    res.status(500).json({ error: 'Error interno al registrar equipo de emergencia' });
  }
};

exports.updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = await persistence.getEquipos();
    const items = Array.isArray(raw) ? [...raw] : [];
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Equipo no encontrado' });
    items[idx] = { ...items[idx], ...req.body, id };
    await persistence.setEquipos(items);
    res.json(items[idx]);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar equipo de emergencia');
    res.status(500).json({ error: 'Error interno al actualizar equipo' });
  }
};

exports.deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = await persistence.getEquipos();
    const items = Array.isArray(raw) ? [...raw] : [];
    const filtered = items.filter((e) => e.id !== id);
    if (filtered.length === items.length) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    await persistence.setEquipos(filtered);
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al eliminar equipo de emergencia');
    res.status(500).json({ error: 'Error interno al eliminar equipo' });
  }
};
