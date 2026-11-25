'use strict';

const crypto = require('node:crypto');
const { getAccesos, saveAccesos, getParqueaderos, saveParqueaderos, getMinuta, saveMinuta } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { sendPaginatedOrArray } = require('../utils/pagination');

async function getAllAccesos(req, res) {
  try {
    const raw = await getAccesos();
    const accesos = Array.isArray(raw) ? raw : [];
    const { estado, tipo, search, torre, apto } = req.query;

    let filtered = [...accesos];

    if (estado) {
      filtered = filtered.filter(a => a.estado === estado);
    }

    if (tipo) {
      filtered = filtered.filter(a => a.tipo === tipo);
    }

    if (torre) {
      filtered = filtered.filter(a => (a.torre || '').toLowerCase() === String(torre).toLowerCase());
    }

    if (apto) {
      filtered = filtered.filter(a => String(a.apto) === String(apto));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(a =>
        (a.nombre || '').toLowerCase().includes(q) ||
        String(a.documento || '').includes(q) ||
        (a.vehiculo?.placa || '').toLowerCase().includes(q) ||
        (a.autorizadoPor || '').toLowerCase().includes(q) ||
        (a.motivo || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.fechaIngreso || b.fechaCreacion || 0) - new Date(a.fechaIngreso || a.fechaCreacion || 0));
    return sendPaginatedOrArray(req, res, filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener accesos');
    res.status(500).json({ error: 'Error interno al obtener accesos' });
  }
}

async function registrarIngreso(req, res) {
  try {
    const { tipo, nombre, documento, unidadId, torre, apto, motivo, vehiculo, autorizadoPor, guarda, parqueaderoAsignado } = req.body;

    if (!nombre || !torre || !apto) {
      return res.status(400).json({ error: 'Nombre, Torre y Apartamento de destino son obligatorios' });
    }

    const necesitaParqueadero = Boolean(parqueaderoAsignado && vehiculo?.placa);
    const [rawAccesos, rawMinuta, rawParqueaderos] = await Promise.all([
      getAccesos(),
      getMinuta().catch(() => null),
      necesitaParqueadero ? getParqueaderos() : Promise.resolve(null),
    ]);
    const accesos = Array.isArray(rawAccesos) ? [...rawAccesos] : [];

    const guardaResponsable = guarda || req.user?.username || req.user?.firstName || 'Guarda de Turno';

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
      guarda: guardaResponsable
    };

    const writeTasks = [];

    if (necesitaParqueadero && Array.isArray(rawParqueaderos)) {
      const parqueaderos = [...rawParqueaderos];
      const pIndex = parqueaderos.findIndex(p => p.id === parqueaderoAsignado);
      if (pIndex !== -1) {
        parqueaderos[pIndex] = {
          ...parqueaderos[pIndex],
          estado: 'ocupado',
          placa: vehiculo.placa,
          unidadId: nuevoAcceso.unidadId,
          torre: nuevoAcceso.torre,
          apto: nuevoAcceso.apto,
          horaIngreso: nuevoAcceso.fechaIngreso,
        };
        writeTasks.push(saveParqueaderos(parqueaderos));
      }
    }

    accesos.unshift(nuevoAcceso);
    writeTasks.push(saveAccesos(accesos));

    if (Array.isArray(rawMinuta)) {
      const minuta = [...rawMinuta];
      minuta.unshift({
        id: `min-${Date.now()}-${generateId(4)}`,
        fecha: nuevoAcceso.fechaIngreso,
        tipo: 'acceso',
        titulo: `Ingreso: ${nuevoAcceso.nombre} (${nuevoAcceso.tipo})`,
        descripcion: `Ingreso autorizado para ${nuevoAcceso.nombre} (Doc: ${nuevoAcceso.documento}) hacia ${nuevoAcceso.torre} Apto ${nuevoAcceso.apto}. Motivo: ${nuevoAcceso.motivo}. Autorizado por: ${nuevoAcceso.autorizadoPor}.${nuevoAcceso.vehiculo?.placa ? ` Vehículo: ${nuevoAcceso.vehiculo.placa}.` : ''}`,
        guarda: guardaResponsable,
        severidad: 'info',
        unidadId: nuevoAcceso.unidadId,
        evidencia: null
      });
      writeTasks.push(
        saveMinuta(minuta).catch((e) => {
          logger.warn({ error: e.message }, 'No se pudo asentar ingreso en minuta');
        })
      );
    }

    await Promise.all(writeTasks);

    logger.info({ id: nuevoAcceso.id, nombre, torre, apto }, 'Ingreso registrado en portería');
    res.status(201).json(nuevoAcceso);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar ingreso');
    res.status(500).json({ error: 'Error interno al registrar ingreso' });
  }
}

async function registrarSalida(req, res) {
  try {
    const [rawAccesos, rawMinuta] = await Promise.all([
      getAccesos(),
      getMinuta().catch(() => null),
    ]);
    const accesos = Array.isArray(rawAccesos) ? [...rawAccesos] : [];
    const { id } = req.params;

    const acceso = accesos.find(a => a.id === id);
    if (!acceso) {
      return res.status(404).json({ error: 'Registro de acceso no encontrado' });
    }

    const guardaResponsable = req.user?.username || req.user?.firstName || acceso.guarda || 'Guarda de Turno';
    acceso.estado = 'finalizado';
    acceso.fechaSalida = new Date().toISOString();

    // Cálculo de permanencia
    const start = new Date(acceso.fechaIngreso);
    const end = new Date(acceso.fechaSalida);
    const diffMs = Math.max(0, end - start);
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    const hrs = Math.floor(mins / 60);
    const duracionStr = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins} min`;

    const writeTasks = [];

    if (acceso.parqueaderoAsignado) {
      const parqueaderos = await getParqueaderos();
      const pIndex = parqueaderos.findIndex(p => p.id === acceso.parqueaderoAsignado);
      if (pIndex !== -1) {
        parqueaderos[pIndex] = {
          ...parqueaderos[pIndex],
          estado: 'disponible',
          placa: null,
          unidadId: null,
          torre: null,
          apto: null,
          horaIngreso: null,
        };
        writeTasks.push(saveParqueaderos(parqueaderos));
      }
    }

    writeTasks.push(saveAccesos(accesos));

    if (Array.isArray(rawMinuta)) {
      const minuta = [...rawMinuta];
      minuta.unshift({
        id: `min-${Date.now()}-${generateId(4)}`,
        fecha: acceso.fechaSalida,
        tipo: 'acceso',
        titulo: `Salida: ${acceso.nombre} (${acceso.tipo})`,
        descripcion: `Se registra salida de ${acceso.nombre} (Doc: ${acceso.documento || 'Sin doc'}). Destino fue ${acceso.torre} Apto ${acceso.apto}. Tiempo de permanencia: ${duracionStr}.${acceso.vehiculo?.placa ? ` Vehículo: ${acceso.vehiculo.placa} retirado.` : ''}`,
        guarda: guardaResponsable,
        severidad: 'info',
        unidadId: acceso.unidadId,
        evidencia: null
      });
      writeTasks.push(
        saveMinuta(minuta).catch((e) => {
          logger.warn({ error: e.message }, 'No se pudo asentar salida en minuta');
        })
      );
    }

    await Promise.all(writeTasks);

    logger.info({ id, nombre: acceso.nombre, duracion: duracionStr }, 'Salida registrada en portería');
    res.json(acceso);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar salida');
    res.status(500).json({ error: 'Error interno al registrar salida' });
  }
}

// ── PRE-AUTORIZACIÓN DE VISITAS POR EL RESIDENTE ──
async function preautorizarIngreso(req, res) {
  try {
    const accesos = await getAccesos();
    const { unidadId, torre, apto, nombre, documento, tipo, motivo, vehiculo, fechaEsperada, observaciones } = req.body;

    if (!nombre || !torre || !apto) {
      return res.status(400).json({ error: 'Nombre de la visita, Torre y Apartamento son obligatorios' });
    }

    const paseQR = 'PASS-' + crypto.randomInt(1000, 10000);

    const nuevaPreautorizacion = {
      id: `acc-pre-${Date.now()}-${generateId(4)}`,
      tipo: tipo || 'visitante', // visitante, familiar, domicilio, contratista, tecnico
      nombre,
      documento: documento || 'Por verificar en portería',
      unidadId: unidadId || `${String(torre).toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre,
      apto: String(apto),
      motivo: motivo || 'Visita autorizada por residente',
      vehiculo: vehiculo || { tipo: 'peatonal', placa: null },
      autorizadoPor: `Residente Apto ${apto}`,
      paseQR,
      fechaCreacion: new Date().toISOString(),
      fechaEsperada: fechaEsperada || new Date().toISOString().split('T')[0],
      fechaIngreso: null,
      fechaSalida: null,
      estado: 'preautorizado', // preautorizado, activo, finalizado, cancelado
      observaciones: observaciones || 'Pre-autorización creada desde el Portal del Residente.'
    };

    accesos.unshift(nuevaPreautorizacion);
    await saveAccesos(accesos);

    // Asentar novedad en la minuta oficial
    try {
      const minuta = await getMinuta();
      minuta.unshift({
        id: `min-${Date.now()}-${generateId(4)}`,
        fecha: new Date().toISOString(),
        tipo: 'acceso',
        titulo: `Pre-autorización: ${nombre} (${nuevaPreautorizacion.tipo})`,
        descripcion: `El residente del Apto ${torre} ${apto} ha pre-autorizado el ingreso de ${nombre} (Pase: ${paseQR}) para la fecha ${nuevaPreautorizacion.fechaEsperada}.`,
        guarda: 'Portal del Residente',
        severidad: 'informativa',
        unidadId: nuevaPreautorizacion.unidadId,
        evidencia: null
      });
      await saveMinuta(minuta);
    } catch (e) {
      logger.warn({ error: e.message }, 'No se pudo asentar pre-autorización en minuta');
    }

    logger.info({ id: nuevaPreautorizacion.id, nombre, paseQR }, 'Pre-autorización de acceso registrada');
    res.status(201).json(nuevaPreautorizacion);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al pre-autorizar ingreso');
    res.status(500).json({ error: 'Error interno al crear pre-autorización' });
  }
}

// ── OBTENER PRE-AUTORIZACIONES DE UN APARTAMENTO ──
async function getPreautorizadosByUnidad(req, res) {
  try {
    const accesos = await getAccesos();
    const { unidadId } = req.params;
    const { apto } = req.query;

    const list = (accesos || []).filter(a => {
      const matchUnidad =
        a.unidadId === unidadId ||
        String(a.apto) === String(unidadId) ||
        (apto && String(a.apto) === String(apto));
      return matchUnidad;
    });

    res.json(list);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener pre-autorizaciones');
    res.status(500).json({ error: 'Error interno al consultar pre-autorizaciones' });
  }
}

// ── CONFIRMAR INGRESO DE VISITA PRE-AUTORIZADA EN PORTERÍA ──
async function aprobarPreautorizado(req, res) {
  try {
    const accesos = await getAccesos();
    const { id } = req.params;
    const { guarda, parqueaderoAsignado } = req.body;

    const index = accesos.findIndex(a => a.id === id || a.paseQR === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pre-autorización no encontrada' });
    }

    const acceso = accesos[index];
    const guardaResponsable = guarda || req.user?.username || req.user?.firstName || 'Guarda de Turno';

    acceso.estado = 'en_conjunto';
    acceso.fechaIngreso = new Date().toISOString();
    acceso.guarda = guardaResponsable;
    acceso.parqueaderoAsignado = parqueaderoAsignado || null;

    // Si ingresa con carro y se asigna bahía
    if (parqueaderoAsignado && acceso.vehiculo?.placa) {
      const parqueaderos = await getParqueaderos();
      const pIndex = parqueaderos.findIndex(p => p.id === parqueaderoAsignado);
      if (pIndex !== -1) {
        parqueaderos[pIndex].estado = 'ocupado';
        parqueaderos[pIndex].placa = acceso.vehiculo.placa;
        parqueaderos[pIndex].unidadId = acceso.unidadId;
        parqueaderos[pIndex].torre = acceso.torre;
        parqueaderos[pIndex].apto = acceso.apto;
        parqueaderos[pIndex].horaIngreso = acceso.fechaIngreso;
        await saveParqueaderos(parqueaderos);
      }
    }

    await saveAccesos(accesos);

    // Asentar en la minuta digital
    try {
      const minuta = await getMinuta();
      minuta.unshift({
        id: `min-${Date.now()}-${generateId(4)}`,
        fecha: acceso.fechaIngreso,
        tipo: 'acceso',
        titulo: `Ingreso Validado: ${acceso.nombre} (Pre-autorizado)`,
        descripcion: `Ingresa a portería ${acceso.nombre} con destino a ${acceso.torre} Apto ${acceso.apto}. Pre-autorizado con código ${acceso.paseQR}.${parqueaderoAsignado ? ` Asignado a bahía ${parqueaderoAsignado}.` : ''}`,
        guarda: guardaResponsable,
        severidad: 'informativa',
        unidadId: acceso.unidadId,
        evidencia: null
      });
      await saveMinuta(minuta);
    } catch (e) {
      logger.warn({ error: e.message }, 'No se pudo asentar ingreso pre-autorizado en minuta');
    }

    logger.info({ id: acceso.id, nombre: acceso.nombre }, 'Ingreso pre-autorizado validado en portería');
    res.json(acceso);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al validar ingreso pre-autorizado');
    res.status(500).json({ error: 'Error interno al procesar ingreso' });
  }
}

module.exports = {
  getAllAccesos,
  registrarIngreso,
  registrarSalida,
  preautorizarIngreso,
  getPreautorizadosByUnidad,
  aprobarPreautorizado
};
