'use strict';

const { getMinuta, saveMinuta } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

async function getAllMinuta(req, res) {
  try {
    const minuta = await getMinuta();
    const { tipo, severidad, search, fecha } = req.query;

    let filtered = [...minuta];

    if (tipo) {
      filtered = filtered.filter(m => m.tipo === tipo);
    }

    if (severidad) {
      filtered = filtered.filter(m => m.severidad === severidad);
    }

    if (fecha) {
      filtered = filtered.filter(m => m.fecha.startsWith(fecha));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.titulo.toLowerCase().includes(q) ||
        m.descripcion.toLowerCase().includes(q) ||
        m.guarda.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener minuta');
    res.status(500).json({ error: 'Error interno al obtener minuta' });
  }
}

async function createMinutaEntry(req, res) {
  try {
    const minuta = await getMinuta();
    const { tipo, titulo, descripcion, severidad, unidadId, evidencia, guarda } = req.body;

    if (!tipo || !descripcion) {
      return res.status(400).json({ error: 'Tipo y descripción son obligatorios' });
    }

    const nuevaEntrada = {
      id: `min-${Date.now()}-${generateId(4)}`,
      fecha: new Date().toISOString(),
      tipo: tipo || 'general',
      titulo: titulo || (tipo === 'cambio_turno' ? 'Cambio de Turno' : 'Registro de Novedad'),
      descripcion,
      guarda: guarda || req.user?.username || req.user?.firstName || 'Guarda de Turno',
      severidad: severidad || 'info', // info, advertencia, peligro
      unidadId: unidadId || null,
      evidencia: evidencia || null
    };

    minuta.unshift(nuevaEntrada);
    await saveMinuta(minuta);

    logger.info({ id: nuevaEntrada.id, tipo: nuevaEntrada.tipo }, 'Novedad registrada en minuta');
    res.status(201).json(nuevaEntrada);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar en minuta');
    res.status(500).json({ error: 'Error interno al registrar en minuta' });
  }
}

async function getMinutaStats(req, res) {
  try {
    const minuta = await getMinuta();
    const hoy = new Date().toISOString().slice(0, 10);
    const hoyEntradas = minuta.filter(m => m.fecha.startsWith(hoy));

    const stats = {
      totalHoy: hoyEntradas.length,
      cambiosTurnoHoy: hoyEntradas.filter(m => m.tipo === 'cambio_turno').length,
      rondasHoy: hoyEntradas.filter(m => m.tipo === 'ronda').length,
      incidentesHoy: hoyEntradas.filter(m => m.tipo === 'incidente' || m.severidad === 'advertencia' || m.severidad === 'peligro').length
    };

    res.json(stats);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener estadísticas de minuta');
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

module.exports = {
  getAllMinuta,
  createMinutaEntry,
  getMinutaStats
};
