'use strict';

const { getTrasteos, saveTrasteos } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

async function getAllTrasteos(req, res) {
  try {
    const trasteos = await getTrasteos();
    const { estado, tipo, torre, apto } = req.query;

    let filtered = [...trasteos];

    if (estado) {
      filtered = filtered.filter(t => t.estado === estado);
    }

    if (tipo) {
      filtered = filtered.filter(t => t.tipo === tipo);
    }

    if (torre) {
      filtered = filtered.filter(t => t.torre?.toLowerCase() === torre.toLowerCase());
    }

    if (apto) {
      filtered = filtered.filter(t => t.apto === apto);
    }

    filtered.sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada));
    res.json(filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener trasteos');
    res.status(500).json({ error: 'Error interno al obtener trasteos' });
  }
}

async function createTrasteo(req, res) {
  try {
    const trasteos = await getTrasteos();
    const { tipo, unidadId, torre, apto, solicitante, telefono, fechaProgramada, horario, empresaMudanza, placaVehiculo, pazYSalvo, depositoGarantia, observaciones } = req.body;

    if (!torre || !apto || !solicitante || !fechaProgramada) {
      return res.status(400).json({ error: 'Torre, Apto, Solicitante y Fecha programada son obligatorios' });
    }

    const nuevoTrasteo = {
      id: `tra-${Date.now()}-${generateId(4)}`,
      tipo: tipo || 'ingreso', // ingreso, salida
      unidadId: unidadId || `${torre.toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre,
      apto: String(apto),
      solicitante,
      telefono: telefono || 'Sin teléfono',
      fechaProgramada,
      horario: horario || '08:00 a 12:00',
      empresaMudanza: empresaMudanza || 'Particular',
      placaVehiculo: placaVehiculo || 'No registrada',
      estado: req.user?.role === 'admin' || req.user?.role === 'owner' ? 'aprobado' : 'pendiente_aprobacion',
      pazYSalvo: Boolean(pazYSalvo),
      depositoGarantia: Number(depositoGarantia) || 0,
      observaciones: observaciones || '',
      aprobadoPor: (req.user?.role === 'admin' || req.user?.role === 'owner') ? (req.user?.username || 'Administración') : null,
      createdAt: new Date().toISOString()
    };

    trasteos.push(nuevoTrasteo);
    await saveTrasteos(trasteos);

    logger.info({ id: nuevoTrasteo.id, torre, apto }, 'Trasteo programado exitosamente');
    res.status(201).json(nuevoTrasteo);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear trasteo');
    res.status(500).json({ error: 'Error interno al programar mudanza' });
  }
}

async function updateTrasteoEstado(req, res) {
  try {
    const trasteos = await getTrasteos();
    const { id } = req.params;
    const { estado, observaciones, pazYSalvo, depositoGarantia } = req.body;

    const trasteo = trasteos.find(t => t.id === id);
    if (!trasteo) {
      return res.status(404).json({ error: 'Trasteo no encontrado' });
    }

    if (estado) trasteo.estado = estado;
    if (observaciones !== undefined) trasteo.observaciones = observaciones;
    if (pazYSalvo !== undefined) trasteo.pazYSalvo = pazYSalvo;
    if (depositoGarantia !== undefined) trasteo.depositoGarantia = depositoGarantia;

    if (estado === 'aprobado') {
      trasteo.aprobadoPor = req.user?.username || req.user?.firstName || 'Administración';
    }

    await saveTrasteos(trasteos);
    logger.info({ id, estado: trasteo.estado }, 'Estado de trasteo actualizado');
    res.json(trasteo);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar trasteo');
    res.status(500).json({ error: 'Error interno al actualizar estado de mudanza' });
  }
}

module.exports = {
  getAllTrasteos,
  createTrasteo,
  updateTrasteoEstado
};
