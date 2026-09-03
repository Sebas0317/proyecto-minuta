'use strict';

const { getAccesos, saveAccesos, getParqueaderos, saveParqueaderos } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

async function getAllAccesos(req, res) {
  try {
    const accesos = await getAccesos();
    const { estado, tipo, search, torre, apto } = req.query;

    let filtered = [...accesos];

    if (estado) {
      filtered = filtered.filter(a => a.estado === estado);
    }

    if (tipo) {
      filtered = filtered.filter(a => a.tipo === tipo);
    }

    if (torre) {
      filtered = filtered.filter(a => a.torre?.toLowerCase() === torre.toLowerCase());
    }

    if (apto) {
      filtered = filtered.filter(a => a.apto === apto);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.nombre.toLowerCase().includes(q) ||
        a.documento?.includes(q) ||
        a.vehiculo?.placa?.toLowerCase().includes(q) ||
        a.autorizadoPor?.toLowerCase().includes(q) ||
        a.motivo?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));
    res.json(filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener accesos');
    res.status(500).json({ error: 'Error interno al obtener accesos' });
  }
}

async function registrarIngreso(req, res) {
  try {
    const accesos = await getAccesos();
    const { tipo, nombre, documento, unidadId, torre, apto, motivo, vehiculo, autorizadoPor, guarda, parqueaderoAsignado } = req.body;

    if (!nombre || !torre || !apto) {
      return res.status(400).json({ error: 'Nombre, Torre y Apartamento de destino son obligatorios' });
    }

    const nuevoAcceso = {
      id: `acc-${Date.now()}-${generateId(4)}`,
      tipo: tipo || 'visitante', // visitante, domicilio, contratista, servicio
      nombre,
      documento: documento || 'Sin documento',
      unidadId: unidadId || `${torre.toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre,
      apto: String(apto),
      motivo: motivo || 'Visita general',
      vehiculo: vehiculo || null, // { placa, tipo }
      parqueaderoAsignado: parqueaderoAsignado || null,
      fechaIngreso: new Date().toISOString(),
      fechaSalida: null,
      estado: 'en_conjunto', // en_conjunto, finalizado
      autorizadoPor: autorizadoPor || 'Residente',
      guarda: guarda || req.user?.username || req.user?.firstName || 'Guarda de Turno'
    };

    // Si tiene vehículo y se asignó parqueadero, ocuparlo
    if (parqueaderoAsignado && vehiculo?.placa) {
      const parqueaderos = await getParqueaderos();
      const pIndex = parqueaderos.findIndex(p => p.id === parqueaderoAsignado);
      if (pIndex !== -1) {
        parqueaderos[pIndex].estado = 'ocupado';
        parqueaderos[pIndex].placa = vehiculo.placa;
        parqueaderos[pIndex].unidadId = nuevoAcceso.unidadId;
        parqueaderos[pIndex].torre = nuevoAcceso.torre;
        parqueaderos[pIndex].apto = nuevoAcceso.apto;
        parqueaderos[pIndex].horaIngreso = nuevoAcceso.fechaIngreso;
        await saveParqueaderos(parqueaderos);
      }
    }

    accesos.unshift(nuevoAcceso);
    await saveAccesos(accesos);

    logger.info({ id: nuevoAcceso.id, nombre, torre, apto }, 'Ingreso registrado en portería');
    res.status(201).json(nuevoAcceso);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar ingreso');
    res.status(500).json({ error: 'Error interno al registrar ingreso' });
  }
}

async function registrarSalida(req, res) {
  try {
    const accesos = await getAccesos();
    const { id } = req.params;

    const acceso = accesos.find(a => a.id === id);
    if (!acceso) {
      return res.status(404).json({ error: 'Registro de acceso no encontrado' });
    }

    acceso.estado = 'finalizado';
    acceso.fechaSalida = new Date().toISOString();

    // Si tenía parqueadero asignado, liberarlo
    if (acceso.parqueaderoAsignado) {
      const parqueaderos = await getParqueaderos();
      const pIndex = parqueaderos.findIndex(p => p.id === acceso.parqueaderoAsignado);
      if (pIndex !== -1) {
        parqueaderos[pIndex].estado = 'disponible';
        parqueaderos[pIndex].placa = null;
        parqueaderos[pIndex].unidadId = null;
        parqueaderos[pIndex].torre = null;
        parqueaderos[pIndex].apto = null;
        parqueaderos[pIndex].horaIngreso = null;
        await saveParqueaderos(parqueaderos);
      }
    }

    await saveAccesos(accesos);
    logger.info({ id }, 'Salida registrada en portería');
    res.json(acceso);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar salida');
    res.status(500).json({ error: 'Error interno al registrar salida' });
  }
}

module.exports = {
  getAllAccesos,
  registrarIngreso,
  registrarSalida
};
