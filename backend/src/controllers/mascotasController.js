'use strict';

const persistence = require('../data/persistence');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/idGenerator');
const { getBogotaDateParts } = require('../utils/colombianHolidays');

exports.getMascotas = async (req, res) => {
  try {
    const { search, especie, torre, apto } = req.query;
    const raw = await persistence.getMascotas();
    let items = Array.isArray(raw) ? [...raw] : [];
    if (especie) items = items.filter((m) => m.especie === especie);
    if (torre) {
      const cleanTorre = String(torre).replace(/torre\s*/i, '').trim();
      items = items.filter((m) => String(m.torre || '').replace(/torre\s*/i, '').trim() === cleanTorre);
    }
    if (apto) {
      items = items.filter((m) => String(m.apto || '').trim() === String(apto).trim());
    }
    if (search) {
      const q = String(search).toLowerCase();
      items = items.filter((m) =>
        (m.nombre || '').toLowerCase().includes(q) ||
        (m.raza || '').toLowerCase().includes(q) ||
        String(m.apto || '').toLowerCase().includes(q) ||
        (m.propietario || m.propietarioNombre || '').toLowerCase().includes(q)
      );
    }
    const isStaff = Boolean(req.user && ['owner', 'admin', 'supervisor', 'guarda', 'operator'].includes(req.user.role));
    const serialized = isStaff
      ? items
      : items.map((m) => {
          const safe = { ...m };
          delete safe.telefono;
          delete safe.telefonoContacto;
          return safe;
        });
    res.json(serialized);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener censo de mascotas');
    res.status(500).json({ error: 'Error interno al obtener mascotas' });
  }
};

exports.createMascota = async (req, res) => {
  try {
    const {
      nombre,
      especie,
      raza,
      apto,
      torre,
      propietario,
      propietarioNombre,
      telefono,
      telefonoContacto,
      color,
      vacunaAntirrabica,
      fechaVacuna,
      manejoEspecial,
      polizaResponsabilidad,
      observaciones,
    } = req.body;
    if (!nombre || !apto || !torre) {
      return res.status(400).json({ error: 'Nombre, torre y apartamento son obligatorios' });
    }
    const raw = await persistence.getMascotas();
    const items = Array.isArray(raw) ? [...raw] : [];
    const ownerName = propietario || propietarioNombre || 'Residente';
    const ownerPhone = telefono || telefonoContacto || '';
    const cleanTorre = String(torre).replace(/torre\s*/i, '').trim() || String(torre);
    const nueva = {
      id: `pet-${Date.now()}-${generateId(4)}`,
      nombre: String(nombre).trim(),
      especie: especie || 'perro',
      raza: raza || 'Mestizo',
      apto: String(apto).trim(),
      torre: cleanTorre,
      propietario: ownerName,
      propietarioNombre: ownerName,
      telefono: ownerPhone,
      telefonoContacto: ownerPhone,
      color: color || '',
      vacunaAntirrabica: vacunaAntirrabica !== false,
      fechaVacuna: fechaVacuna || getBogotaDateParts(new Date()).ymd,
      manejoEspecial: Boolean(manejoEspecial),
      polizaResponsabilidad: polizaResponsabilidad || '',
      qrToken: `PET-${String(nombre).trim().toUpperCase().replace(/\s+/g, '')}-${String(apto).trim()}-T${cleanTorre}-${generateId(4).toUpperCase()}`,
      observaciones: observaciones || ''
    };
    items.unshift(nueva);
    await persistence.setMascotas(items);
    res.status(201).json(nueva);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al registrar mascota');
    res.status(500).json({ error: 'Error interno al registrar mascota' });
  }
};

exports.updateMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = await persistence.getMascotas();
    const items = Array.isArray(raw) ? [...raw] : [];
    const idx = items.findIndex((m) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Mascota no encontrada' });

    const current = items[idx];
    const nextOwner = req.body.propietario ?? req.body.propietarioNombre ?? current.propietario;
    const nextPhone = req.body.telefono ?? req.body.telefonoContacto ?? current.telefono;
    const nextTorre = req.body.torre !== undefined
      ? String(req.body.torre).replace(/torre\s*/i, '').trim() || String(req.body.torre)
      : current.torre;

    items[idx] = {
      ...current,
      nombre: req.body.nombre !== undefined ? String(req.body.nombre).trim() : current.nombre,
      especie: req.body.especie ?? current.especie,
      raza: req.body.raza ?? current.raza,
      apto: req.body.apto !== undefined ? String(req.body.apto).trim() : current.apto,
      torre: nextTorre,
      propietario: nextOwner,
      propietarioNombre: nextOwner,
      telefono: nextPhone,
      telefonoContacto: nextPhone,
      color: req.body.color ?? current.color,
      vacunaAntirrabica: req.body.vacunaAntirrabica ?? current.vacunaAntirrabica,
      fechaVacuna: req.body.fechaVacuna ?? current.fechaVacuna,
      manejoEspecial: req.body.manejoEspecial !== undefined ? Boolean(req.body.manejoEspecial) : current.manejoEspecial,
      polizaResponsabilidad: req.body.polizaResponsabilidad ?? current.polizaResponsabilidad,
      observaciones: req.body.observaciones ?? current.observaciones,
      id: current.id,
      qrToken: current.qrToken,
    };
    await persistence.setMascotas(items);
    res.json(items[idx]);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al actualizar mascota');
    res.status(500).json({ error: 'Error interno al actualizar mascota' });
  }
};

exports.deleteMascota = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = await persistence.getMascotas();
    const items = Array.isArray(raw) ? [...raw] : [];
    const filtered = items.filter((m) => m.id !== id);
    if (filtered.length === items.length) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    await persistence.setMascotas(filtered);
    res.json({ message: 'Mascota eliminada del censo' });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al eliminar mascota');
    res.status(500).json({ error: 'Error interno al eliminar mascota' });
  }
};
