'use strict';

const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

const RESERVAS_FILE = path.resolve(__dirname, '..', '..', 'reservas_zonas.json');

async function getReservas() {
  return (await readJsonFile(RESERVAS_FILE)) || [];
}

async function saveReservas(data) {
  return await writeJsonFile(RESERVAS_FILE, data);
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

// ── CREAR NUEVA RESERVA DE ZONA COMÚN ──
async function createReserva(req, res) {
  try {
    const { espacio, apto, torre, solicitante, telefono, fechaReserva, horaInicio, horaFin, observaciones } = req.body;

    if (!espacio || !apto || !fechaReserva || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Todos los campos de la reserva son obligatorios' });
    }

    const list = await getReservas();

    // Validar traslape horario en el mismo espacio y misma fecha
    const traslape = list.find(r => 
      r.espacio === espacio &&
      r.fechaReserva === fechaReserva &&
      r.estado === 'confirmada' &&
      ((horaInicio >= r.horaInicio && horaInicio < r.horaFin) ||
       (horaFin > r.horaInicio && horaFin <= r.horaFin) ||
       (horaInicio <= r.horaInicio && horaFin >= r.horaFin))
    );

    if (traslape) {
      return res.status(409).json({
        error: `El espacio ya se encuentra reservado el ${fechaReserva} entre ${traslape.horaInicio} y ${traslape.horaFin} por el Apto ${traslape.apto}`
      });
    }

    // Depósitos de garantía según zona
    let deposito = 0;
    if (espacio.includes('Salón Social')) deposito = 200000;
    if (espacio.includes('BBQ')) deposito = 50000;

    const nueva = {
      id: 'res-' + Date.now() + '-' + generateId(4),
      espacio,
      apto,
      torre: torre || '1',
      solicitante: solicitante || `Residente Apto ${apto}`,
      telefono: telefono || '',
      fechaReserva,
      horaInicio,
      horaFin,
      estado: 'confirmada',
      deposito,
      observaciones: observaciones || '',
      fechaCreacion: new Date().toISOString()
    };

    list.unshift(nueva);
    await saveReservas(list);

    logger.info({ id: nueva.id, espacio, apto }, 'Reserva de zona común creada');
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

    const list = await getReservas();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
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