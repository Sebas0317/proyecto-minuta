'use strict';

const { getAsambleas, setAsambleas, getUnidades } = require('../data/persistence');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { hasPermission } = require('../utils/permissions');
const { getBogotaDateParts } = require('../utils/colombianHolidays');

// ── 1. OBTENER ASAMBLEAS ──
async function getAsambleasHandler(req, res) {
  try {
    const list = await getAsambleas();
    res.json(Array.isArray(list) ? list : (list.asambleas || []));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener asambleas');
    res.status(500).json({ error: 'Error interno al consultar asambleas' });
  }
}

// ── 2. CREAR ASAMBLEA ──
async function createAsamblea(req, res) {
  try {
    const { titulo, fecha, horaInicio, totalCoeficiente } = req.body;
    if (!titulo || String(titulo).trim() === '') {
      return res.status(400).json({ error: 'El título de la asamblea es obligatorio' });
    }

    const list = await getAsambleas();
    const asambleas = Array.isArray(list) ? list : (list.asambleas || []);

    const nueva = {
      id: `asmb-${Date.now()}-${generateId(4)}`,
      titulo: String(titulo).trim(),
      fecha: fecha || getBogotaDateParts(new Date()).ymd,
      horaInicio: horaInicio || '08:00 AM',
      estado: 'en_curso', // en_curso, finalizada
      totalCoeficiente: Math.min(100, Math.max(0.01, Number(totalCoeficiente) || 100.0)),
      quorumRegistrado: 0.0,
      votaciones: []
    };

    asambleas.unshift(nueva);
    await setAsambleas(asambleas);

    logger.info({ id: nueva.id, titulo: nueva.titulo }, 'Asamblea creada exitosamente');
    res.status(201).json(nueva);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear asamblea');
    res.status(500).json({ error: 'Error interno al crear asamblea' });
  }
}

// ── 3. ACTUALIZAR QUÓRUM ──
async function updateQuorum(req, res) {
  try {
    const { id } = req.params;
    const { quorumRegistrado } = req.body;

    const list = await getAsambleas();
    const asambleas = Array.isArray(list) ? list : (list.asambleas || []);
    const asmb = asambleas.find(a => a.id === id);

    if (!asmb) {
      return res.status(404).json({ error: 'Asamblea no encontrada' });
    }

    const quorumNum = Number(quorumRegistrado);
    if (isNaN(quorumNum) || quorumNum < 0 || quorumNum > 100) {
      return res.status(400).json({ error: 'El quórum debe ser un valor porcentual válido entre 0 y 100' });
    }

    asmb.quorumRegistrado = Number(quorumNum.toFixed(2));
    await setAsambleas(asambleas);

    res.json(asmb);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar quórum');
    res.status(500).json({ error: 'Error interno al actualizar quórum' });
  }
}

// ── 4. AGREGAR PREGUNTA DE VOTACIÓN ──
async function addVotacion(req, res) {
  try {
    const { id } = req.params;
    const { pregunta } = req.body;

    if (!pregunta || String(pregunta).trim() === '') {
      return res.status(400).json({ error: 'La pregunta de la votación es obligatoria' });
    }

    const list = await getAsambleas();
    const asambleas = Array.isArray(list) ? list : (list.asambleas || []);
    const asmb = asambleas.find(a => a.id === id);

    if (!asmb) {
      return res.status(404).json({ error: 'Asamblea no encontrada' });
    }

    const nuevaVot = {
      id: `vot-${Date.now()}-${generateId(4)}`,
      pregunta: pregunta.trim(),
      estado: 'activa', // activa, cerrada
      votosSi: 0,
      votosNo: 0,
      votosBlanco: 0,
      totalVotado: 0,
      votantes: [] // Array de IDs de unidad o usuario para impedir voto múltiple
    };

    if (!Array.isArray(asmb.votaciones)) {
      asmb.votaciones = [];
    }

    asmb.votaciones.push(nuevaVot);
    await setAsambleas(asambleas);

    logger.info({ asambleaId: id, votacionId: nuevaVot.id }, 'Votación agregada a la asamblea');
    res.status(201).json(nuevaVot);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al agregar votación');
    res.status(500).json({ error: 'Error interno al agregar votación' });
  }
}

// ── 5. EMITIR VOTO CON CONTROL DE UNICIDAD (ANTI VOTE-STUFFING) ──
async function castVote(req, res) {
  try {
    const { id, votId } = req.params;
    const { opcion, coeficiente, unidadId, apto } = req.body;

    if (req.user && !hasPermission(req.user.role, 'asambleas:vote')) {
      return res.status(403).json({ error: 'Tu rol no tiene permisos para emitir votos en asambleas' });
    }

    if (!['si', 'no', 'blanco'].includes(opcion)) {
      return res.status(400).json({ error: "La opción de voto debe ser 'si', 'no' o 'blanco'" });
    }

    const isStaff = req.user && ['owner', 'admin', 'supervisor'].includes(req.user.role);
    const rawIdentifier =
      ((!req.user || isStaff) && (unidadId || apto)) ||
      req.user?.id ||
      req.body.solicitante;

    if (!rawIdentifier || String(rawIdentifier).trim() === '') {
      return res.status(400).json({ error: 'Se requiere unidadId, apartamento o sesión activa para votar' });
    }

    const [list, unidadesRaw] = await Promise.all([
      getAsambleas(),
      getUnidades().catch(() => []),
    ]);
    const asambleas = Array.isArray(list) ? list : (list.asambleas || []);
    const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : [];
    const asmb = asambleas.find(a => a.id === id);

    if (!asmb) {
      return res.status(404).json({ error: 'Asamblea no encontrada' });
    }

    if (asmb.estado && asmb.estado !== 'en_curso') {
      return res.status(400).json({ error: 'La asamblea no se encuentra en curso' });
    }

    const vot = (asmb.votaciones || []).find(v => v.id === votId);
    if (!vot) {
      return res.status(404).json({ error: 'Votación no encontrada' });
    }

    if (vot.estado === 'cerrada') {
      return res.status(400).json({ error: 'La votación ya se encuentra cerrada' });
    }

    if (!Array.isArray(vot.votantes)) {
      vot.votantes = [];
    }

    // Canonicalizar unidad contra censo oficial si existe (evita doble voto por alias '101' vs 't1-101')
    const lookupKey = String(rawIdentifier).trim().toLowerCase();
    const matchedUnidad = unidades.find(u =>
      String(u.id || '').toLowerCase() === lookupKey ||
      String(u.numero || '').toLowerCase() === lookupKey ||
      `t${String(u.torre || '').replace(/\D+/g, '')}-${u.numero}`.toLowerCase() === lookupKey
    );
    const cleanVotante = matchedUnidad ? String(matchedUnidad.id).toLowerCase() : lookupKey;

    if (vot.votantes.includes(cleanVotante)) {
      return res.status(409).json({ error: `La unidad o usuario '${rawIdentifier}' ya emitió su voto en esta pregunta` });
    }

    // Ponderación acotada: impide que un cliente manipule coeficiente=100
    const maxAllowedPeso = isStaff ? 25.0 : 5.0;
    const pesoRaw = coeficiente !== undefined ? Number(coeficiente) : Number(matchedUnidad?.coeficiente || 1.0);
    if (Number.isNaN(pesoRaw) || pesoRaw <= 0 || pesoRaw > maxAllowedPeso) {
      return res.status(400).json({
        error: `Coeficiente de votación inválido (rango permitido: 0.01 - ${maxAllowedPeso}%)`,
      });
    }
    const peso = Number(pesoRaw.toFixed(4));

    if (opcion === 'si') {
      vot.votosSi = Number(((Number(vot.votosSi) || 0) + peso).toFixed(2));
    } else if (opcion === 'no') {
      vot.votosNo = Number(((Number(vot.votosNo) || 0) + peso).toFixed(2));
    } else {
      vot.votosBlanco = Number(((Number(vot.votosBlanco) || 0) + peso).toFixed(2));
    }

    vot.totalVotado = Number(((Number(vot.votosSi) || 0) + (Number(vot.votosNo) || 0) + (Number(vot.votosBlanco) || 0)).toFixed(2));
    vot.votantes.push(cleanVotante);

    await setAsambleas(asambleas);

    logger.info({ asambleaId: id, votacionId: votId, votante: cleanVotante, opcion, peso }, 'Voto registrado exitosamente');
    res.json({
      ...vot,
      message: 'Voto emitido satisfactoriamente',
      votacion: vot
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al emitir voto');
    res.status(500).json({ error: 'Error interno al registrar el voto' });
  }
}

async function closeVotacion(req, res) {
  try {
    const { id, votId } = req.params;
    const list = await getAsambleas();
    const asambleas = Array.isArray(list) ? list : (list.asambleas || []);
    const asmb = asambleas.find(a => a.id === id);

    if (!asmb) {
      return res.status(404).json({ error: 'Asamblea no encontrada' });
    }

    const vot = (asmb.votaciones || []).find(v => v.id === votId);
    if (!vot) {
      return res.status(404).json({ error: 'Votación no encontrada' });
    }

    vot.estado = 'cerrada';
    const si = Number(vot.votosSi) || 0;
    const no = Number(vot.votosNo) || 0;
    vot.resultado = si > no ? 'APROBADA' : no > si ? 'RECHAZADA' : 'EMPATE';
    await setAsambleas(asambleas);

    logger.info({ asambleaId: id, votacionId: votId }, 'Votación cerrada exitosamente');
    res.json({
      ...vot,
      message: 'Votación cerrada satisfactoriamente',
      votacion: vot
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al cerrar votación');
    res.status(500).json({ error: 'Error interno al cerrar votación' });
  }
}

module.exports = {
  getAsambleas: getAsambleasHandler,
  createAsamblea,
  updateQuorum,
  addVotacion,
  castVote,
  closeVotacion
};
