'use strict';

const bcrypt = require('bcryptjs');
const { getUnidades, saveUnidades } = require('../data/jsonStore');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');

/**
 * Serializer / DTO para protección de PII (Habeas Data / Privacidad)
 * Si el usuario es admin o guarda autenticado, accede a la información de gestión.
 * Si es público / no autenticado, elimina estrictamente documentos, teléfonos, emails y PINs.
 */
function serializeUnidad(unidad, isAdminOrStaff = false) {
  if (!unidad || typeof unidad !== 'object') return unidad;

  const safe = { ...unidad };
  delete safe.pinAcceso;
  delete safe.pinAccesoHash; // Nunca exponer PINs ni Hashes en ninguna respuesta

  if (isAdminOrStaff) {
    return safe;
  }

  // DTO Público estricto
  return {
    id: unidad.id,
    torre: unidad.torre,
    numero: unidad.numero,
    piso: unidad.piso,
    tipoOcupacion: unidad.tipoOcupacion || 'propietario',
    estadoComercial: unidad.estadoComercial || 'habitado',
    estado: unidad.estado || 'habitado',
    coeficiente: unidad.coeficiente || 1.0,
    propietario: unidad.propietario ? {
      nombre: unidad.propietario.nombre || 'Propietario'
    } : null,
    residentes: Array.isArray(unidad.residentes)
      ? unidad.residentes.map(r => ({
          nombre: r.nombre,
          parentesco: r.parentesco || 'Residente',
          principal: !!r.principal
        }))
      : [],
    vehiculos: Array.isArray(unidad.vehiculos)
      ? unidad.vehiculos.map(v => ({
          placa: v.placa,
          tipo: v.tipo || 'carro',
          marca: v.marca || ''
        }))
      : [],
    parqueaderosPrivados: Array.isArray(unidad.parqueaderosPrivados) ? unidad.parqueaderosPrivados : [],
    mascotas: Array.isArray(unidad.mascotas) ? unidad.mascotas : [],
    estadoFinanciero: unidad.estadoFinanciero ? {
      administracion: {
        alDia: !!unidad.estadoFinanciero?.administracion?.alDia,
        mesesMora: unidad.estadoFinanciero?.administracion?.mesesMora || 0
      }
    } : null,
    observaciones: unidad.observaciones || '',
    bodega: unidad.bodega || null,
    bicicletero: unidad.bicicletero || null
  };
}

async function getAllUnidades(req, res) {
  try {
    const unidades = await getUnidades();
    const { torre, estado, search } = req.query;

    let filtered = [...unidades];

    if (torre) {
      filtered = filtered.filter(u => u.torre.toLowerCase() === torre.toLowerCase());
    }

    if (estado) {
      filtered = filtered.filter(u => u.estado === estado);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(u => 
        u.numero?.toLowerCase().includes(q) ||
        u.torre?.toLowerCase().includes(q) ||
        u.propietario?.nombre?.toLowerCase().includes(q) ||
        u.residentes?.some(r => r.nombre?.toLowerCase().includes(q) || r.documento?.includes(q)) ||
        u.vehiculos?.some(v => v.placa?.toLowerCase().includes(q))
      );
    }

    const isStaff = req.user && ['admin', 'guarda', 'superadmin', 'auditor'].includes(req.user.role);
    const sanitized = filtered.map(u => serializeUnidad(u, isStaff));

    res.json(sanitized);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener unidades');
    res.status(500).json({ error: 'Error interno al obtener unidades' });
  }
}

async function getUnidadById(req, res) {
  try {
    const unidades = await getUnidades();
    const { id } = req.params;
    const unidad = unidades.find(u => u.id === id || u.numero === id);

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    const isStaff = req.user && ['admin', 'guarda', 'superadmin', 'auditor'].includes(req.user.role);
    res.json(serializeUnidad(unidad, isStaff));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener unidad');
    res.status(500).json({ error: 'Error interno al obtener unidad' });
  }
}

async function createUnidad(req, res) {
  try {
    const unidades = await getUnidades();
    const { torre, numero, piso, propietario, residentes, vehiculos, mascotas, observaciones, pinAcceso } = req.body;

    if (!torre || !numero) {
      return res.status(400).json({ error: 'Torre y número de apartamento son obligatorios' });
    }

    const id = `${torre.toLowerCase().replace(/\s+/g, '')}-${numero}`;
    if (unidades.some(u => u.id === id)) {
      return res.status(409).json({ error: 'Ya existe una unidad con esta Torre y Número' });
    }

    let pinAccesoHash = null;
    if (pinAcceso && String(pinAcceso).trim()) {
      pinAccesoHash = await bcrypt.hash(String(pinAcceso).trim(), 10);
    }

    const nuevaUnidad = {
      id,
      torre,
      numero: String(numero),
      piso: Number(piso) || 1,
      estado: req.body.estado || 'habitado',
      propietario: propietario || null,
      residentes: Array.isArray(residentes) ? residentes : [],
      vehiculos: Array.isArray(vehiculos) ? vehiculos : [],
      mascotas: Array.isArray(mascotas) ? mascotas : [],
      observaciones: observaciones || '',
      pinAccesoHash
    };

    unidades.push(nuevaUnidad);
    await saveUnidades(unidades);

    logger.info({ id: nuevaUnidad.id }, 'Unidad creada exitosamente');
    res.status(201).json(serializeUnidad(nuevaUnidad, true));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al crear unidad');
    res.status(500).json({ error: 'Error interno al crear unidad' });
  }
}

async function updateUnidad(req, res) {
  try {
    const unidades = await getUnidades();
    const { id } = req.params;
    const index = unidades.findIndex(u => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    const unidadExistente = unidades[index];
    const updateData = { ...req.body };

    if (updateData.pinAcceso && String(updateData.pinAcceso).trim()) {
      updateData.pinAccesoHash = await bcrypt.hash(String(updateData.pinAcceso).trim(), 10);
      delete updateData.pinAcceso;
    }

    const unidadActualizada = {
      ...unidadExistente,
      ...updateData,
      id: unidadExistente.id // Preserve ID
    };

    unidades[index] = unidadActualizada;
    await saveUnidades(unidades);

    logger.info({ id }, 'Unidad actualizada exitosamente');
    res.json(serializeUnidad(unidadActualizada, true));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar unidad');
    res.status(500).json({ error: 'Error interno al actualizar unidad' });
  }
}

async function deleteUnidad(req, res) {
  try {
    const unidades = await getUnidades();
    const { id } = req.params;
    const index = unidades.findIndex(u => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    unidades.splice(index, 1);
    await saveUnidades(unidades);

    logger.info({ id }, 'Unidad eliminada exitosamente');
    res.json({ message: 'Unidad eliminada exitosamente' });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al eliminar unidad');
    res.status(500).json({ error: 'Error interno al eliminar unidad' });
  }
}

// ── RESUMEN PÚBLICO DE UNIDADES PARA SELECTOR DEL PORTAL ──
async function getPublicUnidadesSummary(req, res) {
  try {
    const unidades = await getUnidades();
    const summary = (unidades || []).map(u => ({
      id: u.id,
      torre: u.torre,
      numero: u.numero,
      piso: u.piso,
      tipoOcupacion: u.tipoOcupacion || 'propietario',
      estado: u.estado || u.estadoComercial || (u.propietario?.nombre ? 'habitado' : 'vacio'),
      propietarioNombre: u.propietario?.nombre || 'Inmueble Desocupado / Vacío',
      alDia: u.estadoFinanciero?.administracion?.alDia ?? true
    }));
    res.json(summary);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener resumen de unidades');
    res.status(500).json({ error: 'Error interno al consultar resumen de unidades' });
  }
}

// ── CONSULTA DE DATOS PARA EL PORTAL DEL RESIDENTE ──
async function getUnidadPortalData(req, res) {
  try {
    const unidades = await getUnidades();
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    const unidad = (unidades || []).find(u => 
      u.id?.toLowerCase() === cleanId || 
      String(u.numero) === cleanId ||
      `${u.torre?.toLowerCase().replace(/\s+/g, '')}-${u.numero}` === cleanId
    );

    if (!unidad) {
      return res.status(404).json({ error: 'Inmueble no encontrado en el condominio' });
    }

    const isStaff = req.user && ['admin', 'guarda', 'superadmin', 'auditor'].includes(req.user.role);
    res.json(serializeUnidad(unidad, isStaff));
  } catch (err) {
    logger.error({ error: err.message }, 'Error al consultar portal de unidad');
    res.status(500).json({ error: 'Error interno al cargar portal de unidad' });
  }
}

module.exports = {
  getAllUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  getPublicUnidadesSummary,
  getUnidadPortalData,
  serializeUnidad
};
