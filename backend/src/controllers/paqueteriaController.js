'use strict';

const bcrypt = require('bcryptjs');
const { getPaquetes, savePaquetes, getUnidades } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

/**
 * Serializer para paquetería:
 * Oculta estrictamente cualquier PIN o Hash de retiro en listados generales / consultas públicas.
 */
function serializePaquete(paquete, isStaffOrOwner = false) {
  if (!paquete || typeof paquete !== 'object') return paquete;
  const safe = { ...paquete };
  delete safe.codigoRetiro;
  delete safe.codigoRetiroHash;
  return safe;
}

async function getAllPaquetes(req, res) {
  try {
    const paquetes = await getPaquetes();
    const { estado, torre, apto, search } = req.query;

    let filtered = [...paquetes];

    if (estado) {
      filtered = filtered.filter(p => p.estado === estado);
    }

    if (torre) {
      filtered = filtered.filter(p => p.torre.toLowerCase() === torre.toLowerCase());
    }

    if (apto) {
      filtered = filtered.filter(p => p.apto === apto);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.destinatario?.toLowerCase().includes(q) ||
        p.guia?.toLowerCase().includes(q) ||
        p.empresa?.toLowerCase().includes(q) ||
        p.apto?.includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

    const isStaff = req.user && ['admin', 'guarda', 'superadmin'].includes(req.user.role);
    res.json(filtered.map(p => serializePaquete(p, isStaff)));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener paquetes');
    res.status(500).json({ error: 'Error interno al obtener paquetes' });
  }
}

async function createPaquete(req, res) {
  try {
    const paquetes = await getPaquetes();
    const { unidadId, torre, apto, destinatario, empresa, guia, descripcion, guardaIngreso } = req.body;

    if (!torre || !apto || !destinatario) {
      return res.status(400).json({ error: 'Torre, Apartamento y Destinatario son obligatorios' });
    }

    // Generar código de retiro numérico de 4 dígitos
    const codigoRetiroPlano = Math.floor(1000 + Math.random() * 9000).toString();
    const codigoRetiroHash = await bcrypt.hash(codigoRetiroPlano, 10);

    const nuevoPaquete = {
      id: `pkg-${Date.now()}-${generateId(4)}`,
      unidadId: unidadId || `${torre.toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre,
      apto: String(apto),
      destinatario,
      empresa: empresa || 'Mensajería / Domicilio',
      guia: guia || 'S/N',
      descripcion: descripcion || 'Paquete recibido en portería',
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
    const isStaff = req.user && ['admin', 'guarda', 'superadmin'].includes(req.user.role);
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
