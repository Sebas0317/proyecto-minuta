'use strict';

const persistence = require('../data/persistence');
const { logger } = require('../utils/logger');

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
    res.json(items);
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
      id: 'pet-' + Date.now(),
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
      fechaVacuna: fechaVacuna || new Date().toISOString().split('T')[0],
      manejoEspecial: Boolean(manejoEspecial),
      polizaResponsabilidad: polizaResponsabilidad || '',
      qrToken: 'PET-' + String(nombre).trim().toUpperCase().replace(/\s+/g, '') + '-' + String(apto).trim() + '-T' + cleanTorre,
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
    items[idx] = { ...items[idx], ...req.body, id };
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
