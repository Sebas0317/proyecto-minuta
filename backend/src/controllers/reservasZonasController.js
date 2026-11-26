'use strict';

const persistence = require('../data/persistence');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

async function getReservas() {
  const raw = await persistence.getReservasZonas();
  if (Array.isArray(raw)) return [...raw];
  if (raw && Array.isArray(raw.reservas)) return [...raw.reservas];
  return [];
}

async function saveReservas(data) {
  return await persistence.setReservasZonas(data);
}

// ── OBTENER TODAS LAS RESERVAS ──
async function getAllReservas(req, res) {
  try {
    const list = await getReservas();
    res.json(list);
  } catch (err) {
    logger.error({ error: err.message }, 'Error en getAllReservas');
    res.status(500).json({ error: 'Error al obtener reservas de zonas' });
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(hhmm) {
  const m = String(hhmm || '').trim().match(TIME_RE);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function hasTimeOverlap(startA, endA, startB, endB) {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  if (sA === null || eA === null || sB === null || eB === null) return false;
  return sA < eB && eA > sB;
}

// ── CREAR NUEVA RESERVA DE ZONA COMÚN ──
async function createReserva(req, res) {
  try {
    const { espacio, apto, torre, solicitante, telefono, fechaReserva, horaInicio, horaFin, observaciones } = req.body;

    if (!espacio || !apto || !fechaReserva || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Todos los campos de la reserva son obligatorios' });
    }

    const startMin = parseTimeToMinutes(horaInicio);
    const endMin = parseTimeToMinutes(horaFin);
    if (startMin === null || endMin === null) {
      return res.status(400).json({ error: 'Formato de hora inválido. Usa HH:MM (ej: 09:00 a 10:30)' });
    }

    if (endMin <= startMin) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
    }

    const list = await getReservas();
    const espacioStr = String(espacio).trim();

    // Validar traslape horario numérico en el mismo espacio y misma fecha
    const traslape = list.find(r =>
      r.espacio === espacioStr &&
      r.fechaReserva === fechaReserva &&
      r.estado === 'confirmada' &&
      hasTimeOverlap(horaInicio, horaFin, r.horaInicio, r.horaFin)
    );

    if (traslape) {
      return res.status(409).json({
        error: `El espacio ya se encuentra reservado el ${fechaReserva} entre ${traslape.horaInicio} y ${traslape.horaFin} por el Apto ${traslape.apto}`
      });
    }

    // Depósitos de garantía según zona
    let deposito = 0;
    if (espacioStr.includes('Salón Social')) deposito = 200000;
    if (espacioStr.includes('BBQ')) deposito = 50000;

    const nueva = {
      id: 'res-' + Date.now() + '-' + generateId(4),
      espacio: espacioStr,
      apto: String(apto),
      torre: String(torre || '1'),
      solicitante: solicitante || `Residente Apto ${apto}`,
      telefono: telefono || '',
      fechaReserva,
      horaInicio: String(horaInicio).trim(),
      horaFin: String(horaFin).trim(),
      estado: 'confirmada',
      deposito,
      observaciones: observaciones || '',
      fechaCreacion: new Date().toISOString()
    };

    list.unshift(nueva);
    await saveReservas(list);

    logger.info({ id: nueva.id, espacio: espacioStr, apto }, 'Reserva de zona común creada');
    res.status(201).json(nueva);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear reserva');
    res.status(500).json({ error: 'Error interno al registrar reserva' });
  }
}

// ── CANCELAR O FINALIZAR RESERVA ──
async function updateEstadoReserva(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body; // 'cancelada' | 'finalizada' | 'confirmada'

    if (estado && !['confirmada', 'cancelada', 'finalizada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado de reserva inválido' });
    }

    const list = await getReservas();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const target = list[index];
    if (estado === 'confirmada' && target.estado !== 'confirmada') {
      const traslape = list.find((r, idx) =>
        idx !== index &&
        r.espacio === target.espacio &&
        r.fechaReserva === target.fechaReserva &&
        r.estado === 'confirmada' &&
        hasTimeOverlap(target.horaInicio, target.horaFin, r.horaInicio, r.horaFin)
      );
      if (traslape) {
        return res.status(409).json({
          error: `No se puede reactivar: horario ocupado por Apto ${traslape.apto}`,
        });
      }
    }

    list[index].estado = estado || list[index].estado;
    list[index].fechaModificacion = new Date().toISOString();
    await saveReservas(list);

    res.json(list[index]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
}

module.exports = {
  getAllReservas,
  createReserva,
  updateEstadoReserva
};