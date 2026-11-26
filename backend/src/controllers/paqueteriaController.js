'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getPaquetes, savePaquetes } = require('../data/jsonStore');
const { withKeyLock } = require('../data/persistence');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { sendPaginatedOrArray } = require('../utils/pagination');

/**
 * Serializer para paquetería:
 * Oculta estrictamente cualquier PIN o Hash de retiro en listados generales / consultas públicas.
 */
function serializePaquete(paquete, _isStaffOrOwner = false) {
  if (!paquete || typeof paquete !== 'object') return paquete;
  const safe = { ...paquete };
  delete safe.codigoRetiro;
  delete safe.codigoRetiroHash;
  return safe;
}

async function getAllPaquetes(req, res) {
  try {
    const raw = await getPaquetes();
    const paquetes = Array.isArray(raw) ? raw : [];
    const { estado, torre, apto, search } = req.query;

    let filtered = [...paquetes];

    if (estado) {
      filtered = filtered.filter(p => p.estado === estado);
    }

    if (torre) {
      filtered = filtered.filter(p => (p.torre || '').toLowerCase() === String(torre).toLowerCase());
    }

    if (apto) {
      filtered = filtered.filter(p => String(p.apto) === String(apto));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p =>
        (p.destinatario || '').toLowerCase().includes(q) ||
        (p.guia || '').toLowerCase().includes(q) ||
        (p.empresa || '').toLowerCase().includes(q) ||
        (p.tipoRecibo || '').toLowerCase().includes(q) ||
        String(p.apto || '').includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.fechaIngreso || 0) - new Date(a.fechaIngreso || 0));

    const isStaff = req.user && ['owner', 'admin', 'supervisor', 'guarda', 'superadmin'].includes(req.user.role);
    const sanitized = filtered.map(p => serializePaquete(p, isStaff));
    return sendPaginatedOrArray(req, res, sanitized);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener paquetes');
    res.status(500).json({ error: 'Error interno al obtener paquetes' });
  }
}

async function createPaquete(req, res) {
  try {
    const {
      unidadId,
      torre,
      apto,
      destinatario,
      empresa,
      guia,
      descripcion,
      observacion,
      guardaIngreso,
      categoria,
      tipoRecibo,
      mesFacturado,
      valorFactura,
    } = req.body;

    const esRecibo = categoria === 'recibo_publico';
    if (!torre || !apto || (!destinatario && !esRecibo)) {
      return res.status(400).json({ error: 'Torre, Apartamento y Destinatario son obligatorios' });
    }

    // Generar y hashear PIN fuera del lock para paralelizar bcrypt en múltiples hilos CPU
    const codigoRetiroPlano = crypto.randomInt(1000, 10000).toString();
    const codigoRetiroHash = await bcrypt.hash(codigoRetiroPlano, 8);

    const nuevoPaquete = {
      id: `pkg-${Date.now()}-${generateId(4)}`,
      unidadId: unidadId || `${String(torre).toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre: String(torre),
      apto: String(apto),
      destinatario: destinatario || `Residente Apto ${apto}`,
      categoria: esRecibo ? 'recibo_publico' : (categoria || 'encomienda'),
      empresa: empresa || tipoRecibo || 'Mensajería / Domicilio',
      guia: guia || (esRecibo ? `REC-${mesFacturado || 'MES'}` : 'S/N'),
      descripcion: descripcion || observacion || (esRecibo ? `Recibo de ${tipoRecibo || 'Servicio Público'}` : 'Paquete recibido en portería'),
      ...(esRecibo ? {
        tipoRecibo: tipoRecibo || empresa || 'Servicio Público',
        mesFacturado: mesFacturado || '',
        valorFactura: Number(valorFactura) || 0,
      } : {}),
      estado: 'recibido', // recibido, notificado, entregado
      fechaIngreso: new Date().toISOString(),
      fechaEntrega: null,
      guardaIngreso: guardaIngreso || req.user?.username || req.user?.firstName || 'Guarda de Turno',
      guardaEntrega: null,
      codigoRetiroHash, // NUNCA texto plano en la BD
      retiradoPor: null
    };

    await withKeyLock('data:paquetes', async () => {
      const raw = await getPaquetes();
      const paquetes = Array.isArray(raw) ? [...raw] : [];
      paquetes.unshift(nuevoPaquete);
      await savePaquetes(paquetes);
    });

    logger.info({ id: nuevoPaquete.id, torre, apto }, 'Paquete registrado exitosamente');
    // El PIN plano se retorna ÚNICAMENTE en este payload 201 para notificación inmediata por WhatsApp
    const responsePayload = {
      ...serializePaquete(nuevoPaquete, true),
      codigoRetiro: codigoRetiroPlano
    };
    res.status(201).json(responsePayload);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear paquete');
    res.status(500).json({ error: 'Error interno al registrar paquete' });
  }
}

async function notificarPaquete(req, res) {
  try {
    const { id } = req.params;
    const result = await withKeyLock('data:paquetes', async () => {
      const raw = await getPaquetes();
      const paquetes = Array.isArray(raw) ? [...raw] : [];
      const paquete = paquetes.find(p => p.id === id);
      if (!paquete) return { status: 404 };
      if (paquete.estado === 'entregado') return { status: 400 };
      paquete.estado = 'notificado';
      await savePaquetes(paquetes);
      return { status: 200, paquete };
    });

    if (result.status === 404) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    if (result.status === 400) {
      return res.status(400).json({ error: 'Este paquete ya fue entregado previamente' });
    }

    logger.info({ id }, 'Paquete marcado como notificado');
    res.json(serializePaquete(result.paquete, true));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al notificar paquete');
    res.status(500).json({ error: 'Error interno al notificar paquete' });
  }
}

async function entregarPaquete(req, res) {
  try {
    const rawInitial = await getPaquetes();
    const initialList = Array.isArray(rawInitial) ? rawInitial : [];
    const { id } = req.params;
    const { retiradoPor, guardaEntrega, codigoRetiro } = req.body;

    const candidate = initialList.find(p => p.id === id);
    if (!candidate) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    if (candidate.estado === 'entregado') {
      return res.status(400).json({ error: 'Este paquete ya fue entregado previamente' });
    }

    // ── VALIDACIÓN ESTRICTA Y OBLIGATORIA DEL PIN DE RETIRO (fuera del lock de escritura) ──
    if (!codigoRetiro || String(codigoRetiro).trim() === '') {
      return res.status(400).json({ error: 'El código PIN de retiro es obligatorio para autorizar la entrega' });
    }

    let isValid = false;
    if (candidate.codigoRetiroHash) {
      isValid = await bcrypt.compare(String(codigoRetiro).trim(), candidate.codigoRetiroHash);
    } else if (candidate.codigoRetiro) {
      isValid = (String(codigoRetiro).trim() === String(candidate.codigoRetiro).trim());
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Código PIN de retiro incorrecto' });
    }

    if (req.onPinSuccess) {
      await req.onPinSuccess();
    }

    const result = await withKeyLock('data:paquetes', async () => {
      const raw = await getPaquetes();
      const paquetes = Array.isArray(raw) ? [...raw] : [];
      const paquete = paquetes.find(p => p.id === id);
      if (!paquete) return { status: 404 };
      if (paquete.estado === 'entregado') return { status: 400 };
      paquete.estado = 'entregado';
      paquete.fechaEntrega = new Date().toISOString();
      paquete.guardaEntrega = guardaEntrega || req.user?.username || req.user?.firstName || 'Guarda de Turno';
      paquete.retiradoPor = (retiradoPor && String(retiradoPor).trim()) || 'Residente titular';
      await savePaquetes(paquetes);
      return { status: 200, paquete };
    });

    if (result.status === 404) return res.status(404).json({ error: 'Paquete no encontrado' });
    if (result.status === 400) return res.status(400).json({ error: 'Este paquete ya fue entregado previamente' });

    logger.info({ id, retiradoPor: result.paquete.retiradoPor }, 'Paquete entregado exitosamente');
    res.json(serializePaquete(result.paquete, true));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al entregar paquete');
    res.status(500).json({ error: 'Error interno al entregar paquete' });
  }
}

// ── CONSULTAR PAQUETES DE UN APARTAMENTO ESPECÍFICO (PORTAL DEL RESIDENTE) ──
async function getPaquetesByApto(req, res) {
  try {
    const paquetes = await getPaquetes();
    const { apto } = req.params;
    const { torre } = req.query;

    const list = (Array.isArray(paquetes) ? paquetes : []).filter(p => {
      const matchApto = String(p.apto) === String(apto) || p.unidadId === apto;
      const matchTorre = torre ? String(p.torre || '').toLowerCase() === String(torre).toLowerCase() : true;
      return matchApto && matchTorre;
    });

    list.sort((a, b) => new Date(b.fechaIngreso || 0) - new Date(a.fechaIngreso || 0));

    // NUNCA devolver el PIN de retiro en consultas públicas/listados de apartamento
    const isStaff = req.user && ['owner', 'admin', 'supervisor', 'guarda', 'superadmin'].includes(req.user.role);
    const sanitized = list.map(p => serializePaquete(p, isStaff));

    res.json(sanitized);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener paquetes por apartamento');
    res.status(500).json({ error: 'Error interno al consultar paquetería del inmueble' });
  }
}

module.exports = {
  getAllPaquetes,
  createPaquete,
  notificarPaquete,
  entregarPaquete,
  getPaquetesByApto,
  serializePaquete
};
