'use strict';

const { getMinuta, saveMinuta } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { sendPaginatedOrArray } = require('../utils/pagination');
const { getBogotaDateParts } = require('../utils/colombianHolidays');

function normalizeMinutaEntry(m, isStaff = true) {
  if (!m || typeof m !== 'object') return m;
  const rawDesc = m.descripcion || '';
  const safeDesc = isStaff
    ? rawDesc
    : rawDesc.replace(/\(Doc:\s*[^)]+\)/gi, '(Doc: Protegido)');
  return {
    ...m,
    titulo: m.titulo || (m.tipo === 'emergencia' ? `Alerta SOS ${m.radicado || ''}`.trim() : m.tipo === 'cambio_turno' ? 'Cambio de Turno' : 'Registro de Novedad'),
    guarda: m.guarda || m.guardaTurno || 'Guarda de Turno',
    descripcion: safeDesc,
    severidad: m.severidad || 'info',
  };
}

async function getAllMinuta(req, res) {
  try {
    const raw = await getMinuta();
    const isStaff = Boolean(req.user && ['owner', 'admin', 'supervisor', 'guarda', 'operator', 'analyst'].includes(req.user.role));
    const minuta = Array.isArray(raw) ? raw.map((m) => normalizeMinutaEntry(m, isStaff)) : [];
    const { tipo, severidad, search, fecha } = req.query;

    let filtered = [...minuta];

    if (tipo) {
      filtered = filtered.filter(m => m.tipo === tipo);
    }

    if (severidad) {
      filtered = filtered.filter(m => m.severidad === severidad);
    }

    if (fecha) {
      const targetFecha = String(fecha);
      filtered = filtered.filter(m => m.fecha && getBogotaDateParts(m.fecha).ymd === targetFecha);
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(m =>
        (m.titulo || '').toLowerCase().includes(q) ||
        (m.descripcion || '').toLowerCase().includes(q) ||
        (m.guarda || m.guardaTurno || '').toLowerCase().includes(q) ||
        (m.radicado || '').toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    return sendPaginatedOrArray(req, res, filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener minuta');
    res.status(500).json({ error: 'Error interno al obtener minuta' });
  }
}

async function createMinutaEntry(req, res) {
  try {
    const raw = await getMinuta();
    const minuta = Array.isArray(raw) ? [...raw] : [];
    const { tipo, titulo, descripcion, severidad, unidadId, evidencia, guarda, radicado } = req.body;

    if (!tipo || !descripcion) {
      return res.status(400).json({ error: 'Tipo y descripción son obligatorios' });
    }

    const guardaName = guarda || req.user?.username || req.user?.firstName || 'Guarda de Turno';
    const nuevaEntrada = {
      id: `min-${Date.now()}-${generateId(4)}`,
      fecha: new Date().toISOString(),
      tipo: tipo || 'general',
      titulo: titulo || (tipo === 'cambio_turno' ? 'Cambio de Turno' : 'Registro de Novedad'),
      descripcion,
      guarda: guardaName,
      guardaTurno: guardaName,
      severidad: severidad || 'info', // info, advertencia, peligro
      unidadId: unidadId || null,
      evidencia: evidencia || null,
      ...(radicado ? { radicado } : {})
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
    const raw = await getMinuta();
    const minuta = Array.isArray(raw) ? raw : [];
    const hoy = getBogotaDateParts(new Date()).ymd;
    const hoyEntradas = minuta.filter(m => m.fecha && getBogotaDateParts(m.fecha).ymd === hoy);

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
