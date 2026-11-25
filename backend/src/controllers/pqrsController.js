'use strict';

const { getPqrs, savePqrs } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { calcularDiasHabilesColombia } = require('../utils/colombianHolidays');

function calcular15DiasHabiles(fechaInicio = new Date()) {
  return calcularDiasHabilesColombia(fechaInicio, 15);
}

function normalizePqrsItem(p) {
  if (!p || typeof p !== 'object') return p;
  const fecha = p.fecha || p.fechaRadicado || null;
  const fechaLimite = p.fechaLimiteRespuesta || p.fechaVencimiento || null;
  return {
    ...p,
    fecha,
    fechaRadicado: p.fechaRadicado || fecha,
    fechaLimiteRespuesta: fechaLimite,
    fechaVencimiento: p.fechaVencimiento || fechaLimite,
    respuestas: Array.isArray(p.respuestas) ? p.respuestas : [],
  };
}

function getNextPqrsRadicado(lista, year = new Date().getFullYear()) {
  const prefix = `PQR-${year}-`;
  let maxSeq = 0;
  for (const item of lista || []) {
    const rad = String(item?.radicado || '');
    if (rad.startsWith(prefix)) {
      const parsed = parseInt(rad.slice(prefix.length), 10);
      if (!isNaN(parsed) && parsed > maxSeq) maxSeq = parsed;
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

async function getAllPqrs(req, res) {
  try {
    const raw = await getPqrs();
    const lista = Array.isArray(raw) ? raw.map(normalizePqrsItem) : [];
    const { estado, tipo, categoria, torre, apto, search } = req.query;

    let filtered = [...lista];

    if (estado && estado !== 'todos') {
      filtered = filtered.filter(p => p.estado === estado);
    }
    if (tipo && tipo !== 'todos') {
      filtered = filtered.filter(p => p.tipo === tipo);
    }
    if (categoria && categoria !== 'todos') {
      filtered = filtered.filter(p => p.categoria === categoria);
    }
    if (torre && torre !== 'todas') {
      filtered = filtered.filter(p => p.torre && p.torre.toLowerCase() === torre.toLowerCase());
    }
    if (apto) {
      filtered = filtered.filter(p => String(p.apto) === String(apto));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(p =>
        (p.radicado && p.radicado.toLowerCase().includes(q)) ||
        (p.asunto && p.asunto.toLowerCase().includes(q)) ||
        (p.solicitante && p.solicitante.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.apto && String(p.apto).includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.fechaRadicado || b.fecha || 0) - new Date(a.fechaRadicado || a.fecha || 0));
    res.json(filtered);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener PQRS');
    res.status(500).json({ error: 'Error interno al obtener PQRS' });
  }
}

async function getPqrsById(req, res) {
  try {
    const raw = await getPqrs();
    const lista = Array.isArray(raw) ? raw : [];
    const item = lista.find(p => p.id === req.params.id || p.radicado === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'PQRS no encontrada' });
    }
    res.json(normalizePqrsItem(item));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener detalle de PQRS');
    res.status(500).json({ error: 'Error interno' });
  }
}

async function createPqrs(req, res) {
  try {
    const raw = await getPqrs();
    const lista = Array.isArray(raw) ? [...raw] : [];
    const { tipo, categoria, torre, apto, solicitante, telefono, asunto, descripcion, prioridad, email } = req.body;

    if (!torre || !apto || !asunto || !descripcion) {
      return res.status(400).json({ error: 'Torre, Apto, Asunto y Descripción son obligatorios' });
    }

    const radicado = getNextPqrsRadicado(lista);
    const fechaActual = new Date().toISOString();
    const fechaLimite = calcular15DiasHabiles(new Date());

    const nuevaPqr = {
      id: `pqr-${Date.now()}-${generateId(4)}`,
      radicado: radicado,
      tipo: tipo || 'peticion',
      categoria: categoria || 'Petición',
      torre: torre,
      apto: String(apto),
      solicitante: solicitante || 'Residente',
      email: email || '',
      telefono: telefono || '',
      asunto: asunto,
      descripcion: descripcion,
      estado: 'radicado',
      prioridad: prioridad || 'media',
      fecha: fechaActual,
      fechaRadicado: fechaActual,
      fechaLimiteRespuesta: fechaLimite,
      fechaVencimiento: fechaLimite,
      respuestas: [],
      notasInternas: '',
      creadoPor: (req.user && (req.user.username || req.user.firstName)) || 'Residente'
    };

    lista.push(nuevaPqr);
    await savePqrs(lista);

    logger.info({ radicado: radicado, torre: torre, apto: apto }, 'PQRS radicada exitosamente');
    res.status(201).json(nuevaPqr);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear PQRS');
    res.status(500).json({ error: 'Error interno al radicar PQRS' });
  }
}

async function responderPqrs(req, res) {
  try {
    const lista = await getPqrs();
    const { id } = req.params;
    const { mensaje, respuesta, nuevoEstado, respondidoPor } = req.body;
    const textoRespuesta = respuesta || mensaje;

    if (!textoRespuesta || !textoRespuesta.trim()) {
      return res.status(400).json({ error: 'El mensaje de respuesta es obligatorio' });
    }

    const pqr = lista.find(p => String(p.id) === String(id) || String(p.radicado) === String(id));
    if (!pqr) {
      return res.status(404).json({ error: 'PQRS no encontrada' });
    }

    const autorNombre = respondidoPor || ((req.user && req.user.firstName) ? `${req.user.firstName} (Administración)` : 'Administración EcoBosque');

    const respuestaObj = {
      id: `resp-${Date.now()}-${generateId(3)}`,
      autor: autorNombre,
      respondidoPor: autorNombre,
      fecha: new Date().toISOString().slice(0, 10),
      mensaje: textoRespuesta.trim(),
      respuesta: textoRespuesta.trim()
    };

    pqr.respuestas = pqr.respuestas || [];
    pqr.respuestas.push(respuestaObj);
    pqr.estado = nuevoEstado || 'respondido';
    pqr.fechaUltimaRespuesta = new Date().toISOString();

    await savePqrs(lista);
    logger.info({ id: id, radicado: pqr.radicado }, 'Respuesta oficial agregada a PQRS');
    res.json(pqr);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al responder PQRS');
    res.status(500).json({ error: 'Error interno al responder PQRS' });
  }
}

async function updatePqrsEstado(req, res) {
  try {
    const lista = await getPqrs();
    const { id } = req.params;
    const { estado, prioridad, notasInternas } = req.body;

    const pqr = lista.find(p => p.id === id || p.radicado === id);
    if (!pqr) {
      return res.status(404).json({ error: 'PQRS no encontrada' });
    }

    if (estado) pqr.estado = estado;
    if (prioridad) pqr.prioridad = prioridad;
    if (notasInternas !== undefined) pqr.notasInternas = notasInternas;

    await savePqrs(lista);
    logger.info({ id: id, estado: pqr.estado }, 'Estado de PQRS actualizado');
    res.json(pqr);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar PQRS');
    res.status(500).json({ error: 'Error interno al actualizar PQRS' });
  }
}

async function deletePqrs(req, res) {
  try {
    let lista = await getPqrs();
    const { id } = req.params;

    const index = lista.findIndex(p => p.id === id || p.radicado === id);
    if (index === -1) {
      return res.status(404).json({ error: 'PQRS no encontrada' });
    }

    const removed = lista.splice(index, 1)[0];
    await savePqrs(lista);

    logger.info({ id: id, radicado: removed.radicado }, 'PQRS eliminada/archivada');
    res.json({ success: true, removed: removed });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al eliminar PQRS');
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {
  getAllPqrs,
  getPqrsById,
  createPqrs,
  responderPqrs,
  updatePqrsEstado,
  deletePqrs
};
