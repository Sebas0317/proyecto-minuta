'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getPaquetes, savePaquetes } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

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
    res.json(filtered.map(p => serializePaquete(p, isStaff)));
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

    // Generar código de retiro numérico criptográficamente seguro de 4 dígitos en paralelo con lectura de BD
    const codigoRetiroPlano = crypto.randomInt(1000, 10000).toString();
    const [raw, codigoRetiroHash] = await Promise.all([
      getPaquetes(),
      bcrypt.hash(codigoRetiroPlano, 8),
    ]);
    const paquetes = Array.isArray(raw) ? [...raw] : [];

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

    paquetes.unshift(nuevoPaquete);
    await savePaquetes(paquetes);

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
    const paquetes = await getPaquetes();
    const { id } = req.params;
    const paquete = paquetes.find(p => p.id === id);

    if (!paquete) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    paquete.estado = 'notificado';
    await savePaquetes(paquetes);

    logger.info({ id }, 'Paquete marcado como notificado');
    res.json(serializePaquete(paquete, true));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al notificar paquete');
    res.status(500).json({ error: 'Error interno al notificar paquete' });
  }
}

async function entregarPaquete(req, res) {
  try {
    const paquetes = await getPaquetes();
    const { id } = req.params;
    const { retiradoPor, guardaEntrega, codigoRetiro } = req.body;

    const paquete = paquetes.find(p => p.id === id);
    if (!paquete) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    if (paquete.estado === 'entregado') {
      return res.status(400).json({ error: 'Este paquete ya fue entregado previamente' });
    }

    // ── VALIDACIÓN ESTRICTA Y OBLIGATORIA DEL PIN DE RETIRO ──
    if (!codigoRetiro || String(codigoRetiro).trim() === '') {
      return res.status(400).json({ error: 'El código PIN de retiro es obligatorio para autorizar la entrega' });
    }

    let isValid = false;
    if (paquete.codigoRetiroHash) {
      isValid = await bcrypt.compare(String(codigoRetiro).trim(), paquete.codigoRetiroHash);
    } else if (paquete.codigoRetiro) {
      isValid = (String(codigoRetiro).trim() === String(paquete.codigoRetiro).trim());
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Código PIN de retiro incorrecto' });
    }

    if (req.onPinSuccess) {
      await req.onPinSuccess();
    }

    paquete.estado = 'entregado';
    paquete.fechaEntrega = new Date().toISOString();
    paquete.guardaEntrega = guardaEntrega || req.user?.username || req.user?.firstName || 'Guarda de Turno';
    paquete.retiradoPor = (retiradoPor && String(retiradoPor).trim()) || 'Residente titular';

    await savePaquetes(paquetes);

    logger.info({ id, retiradoPor: paquete.retiradoPor }, 'Paquete entregado exitosamente');
    res.json(serializePaquete(paquete, true));
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

    const list = (paquetes || []).filter(p => {
      const matchApto = String(p.apto) === String(apto) || p.unidadId === apto;
      const matchTorre = torre ? p.torre?.toLowerCase() === torre.toLowerCase() : true;
      return matchApto && matchTorre;
    });

    list.sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

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
