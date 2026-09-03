'use strict';

const { getAccesos, saveAccesos, getParqueaderos, saveParqueaderos, getMinuta, saveMinuta } = require('../data/jsonStore');
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

    // Asentar en la minuta digital
    try {
      const minuta = await getMinuta();
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
      await saveMinuta(minuta);
    } catch (e) {
      logger.warn({ error: e.message }, 'No se pudo asentar ingreso en minuta');
    }

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

    // Asentar en la minuta digital
    try {
      const minuta = await getMinuta();
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
      await saveMinuta(minuta);
    } catch (e) {
      logger.warn({ error: e.message }, 'No se pudo asentar salida en minuta');
    }

    logger.info({ id, nombre: acceso.nombre, duracion: duracionStr }, 'Salida registrada en portería');
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
