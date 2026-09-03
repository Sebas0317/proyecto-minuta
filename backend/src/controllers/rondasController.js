'use strict';

const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

const RONDAS_FILE = path.resolve(__dirname, '..', '..', 'rondas.json');

async function getRondasData() {
  const data = await readJsonFile(RONDAS_FILE);
  return data || { puntosControl: [], registrosRondas: [] };
}

async function saveRondasData(data) {
  return await writeJsonFile(RONDAS_FILE, data);
}

// ── OBTENER PUNTOS DE CONTROL Y REGISTROS ──
async function getAllRondas(req, res) {
  try {
    const data = await getRondasData();
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Error en getAllRondas');
    res.status(500).json({ error: 'Error al obtener datos de rondas' });
  }
}

// ── REGISTRAR ESCANEO DE RONDA (POR QR O MANUAL) ──
async function registrarPuntoRonda(req, res) {
  try {
    const { puntoId, qrToken, guarda, estado, observaciones } = req.body;

    const data = await getRondasData();
    let punto = null;

    if (puntoId) {
      punto = data.puntosControl.find(p => p.id === puntoId);
    } else if (qrToken) {
      punto = data.puntosControl.find(p => p.qrToken === qrToken);
    }

    if (!punto) {
      return res.status(404).json({ error: 'Punto de control o código QR no reconocido' });
    }

    const nuevoRegistro = {
      id: 'rd-' + Date.now() + '-' + generateId(4),
      fecha: new Date().toISOString(),
      puntoId: punto.id,
      nombrePunto: punto.nombre,
      ubicacion: punto.ubicacion,
      guarda: guarda || 'Guarda de Turno',
      estado: estado || 'normal', // 'normal' | 'novedad'
      observaciones: observaciones || (estado === 'novedad' ? 'Novedad detectada en punto de control' : 'Punto verificado sin novedades.')
    };

    data.registrosRondas.unshift(nuevoRegistro);
    await saveRondasData(data);

    logger.info({ registroId: nuevoRegistro.id, punto: punto.nombre }, 'Punto de ronda registrado');
    res.status(201).json({
      success: true,
      message: 'Punto de control validado exitosamente',
      registro: nuevoRegistro
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar ronda');
    res.status(500).json({ error: 'Error al registrar ronda de vigilancia' });
  }
}

// ── CREAR NUEVO PUNTO DE CONTROL PERIMETRAL ──
async function createPuntoControl(req, res) {
  try {
    const { nombre, ubicacion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del punto de control es obligatorio' });
    }

    const data = await getRondasData();
    const token = 'QR-' + nombre.slice(0, 4).toUpperCase().replace(/\s+/g, '') + '-' + generateId(6).toUpperCase();

    const nuevoPunto = {
      id: 'pc-' + Date.now() + '-' + generateId(4),
      nombre,
      ubicacion: ubicacion || 'Área General',
      qrToken: token,
      orden: data.puntosControl.length + 1
    };

    data.puntosControl.push(nuevoPunto);
    await saveRondasData(data);

    res.status(201).json(nuevoPunto);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear punto de control' });
  }
}

module.exports = {
  getAllRondas,
  registrarPuntoRonda,
  createPuntoControl
};