'use strict';

const { getParqueaderos, saveParqueaderos, getMinuta, saveMinuta } = require('../data/jsonStore');
const { logger } = require('../utils/logger');

async function getAllParqueaderos(req, res) {
  try {
    const { categoria, estado } = req.query;
    let parqueaderos = await getParqueaderos();

    if (categoria) {
      parqueaderos = parqueaderos.filter(p => p.categoria === categoria);
    }
    if (estado) {
      parqueaderos = parqueaderos.filter(p => p.estado === estado);
    }

    res.json(parqueaderos);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener parqueaderos');
    res.status(500).json({ error: 'Error interno al obtener parqueaderos' });
  }
}

async function ocuparParqueadero(req, res) {
  try {
    const parqueaderos = await getParqueaderos();
    const { id } = req.params;
    const { placa, tipo, unidadId, torre, apto } = req.body;

    const index = parqueaderos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía de parqueadero no encontrada' });
    }

    if (!placa || !torre || !apto) {
      return res.status(400).json({ error: 'Placa, Torre y Apartamento son requeridos' });
    }

    parqueaderos[index] = {
      ...parqueaderos[index],
      estado: 'ocupado',
      placa: placa.toUpperCase().trim(),
      tipo: tipo || parqueaderos[index].tipo || 'carro',
      unidadId: unidadId || `${torre.toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre,
      apto: String(apto),
      horaIngreso: new Date().toISOString()
    };

    await saveParqueaderos(parqueaderos);
    logger.info({ id, placa }, 'Parqueadero de visitantes ocupado exitosamente');
    res.json(parqueaderos[index]);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al ocupar parqueadero');
    res.status(500).json({ error: 'Error interno al asignar parqueadero' });
  }
}

async function liberarParqueadero(req, res) {
  try {
    const parqueaderos = await getParqueaderos();
    const { id } = req.params;

    const index = parqueaderos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía de parqueadero no encontrada' });
    }

    const anterior = { ...parqueaderos[index] };

    parqueaderos[index] = {
      ...parqueaderos[index],
      estado: 'disponible',
      placa: null,
      unidadId: null,
      torre: null,
      apto: null,
      horaIngreso: null,
      invasion: null
    };

    await saveParqueaderos(parqueaderos);
    logger.info({ id, placa: anterior.placa }, 'Parqueadero liberado exitosamente');
    res.json({ message: 'Parqueadero liberado exitosamente', anterior });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al liberar parqueadero');
    res.status(500).json({ error: 'Error interno al liberar parqueadero' });
  }
}

// ── REGISTRAR VEHÍCULO EN BAHÍA PRIVADA (INVASIÓN / PRÉSTAMO) ──
async function reportarInvasion(req, res) {
  try {
    const parqueaderos = await getParqueaderos();
    const { bahiaId, placa, aptoResponsable, torreResponsable, nombreResponsable, telefonoResponsable, motivo } = req.body;

    if (!bahiaId || !placa || !aptoResponsable) {
      return res.status(400).json({ error: 'Bahía, Placa y Apartamento Responsable son requeridos' });
    }

    const index = parqueaderos.findIndex(p => p.id === bahiaId);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía privada no encontrada' });
    }

    parqueaderos[index].estado = 'invadido';
    parqueaderos[index].invasion = {
      placa: placa.toUpperCase().trim(),
      vehiculoTipo: 'carro',
      aptoResponsable: String(aptoResponsable),
      torreResponsable: torreResponsable || 'Torre 1',
      nombreResponsable: nombreResponsable || 'Visitante no identificado',
      telefonoResponsable: telefonoResponsable || 'No registrado',
      horaIngreso: new Date().toISOString(),
      motivo: motivo || 'Parqueado temporalmente en bahía ajena'
    };

    await saveParqueaderos(parqueaderos);

    // Asentar en minuta automáticamente
    try {
      const minuta = await getMinuta();
      minuta.unshift({
        id: `min-inv-${Date.now()}`,
        fecha: new Date().toISOString(),
        tipo: 'incidente',
        titulo: `⚠️ Vehículo parqueado en bahía privada ajena (${bahiaId})`,
        descripcion: `El vehículo placa ${placa.toUpperCase()} se estacionó en la bahía ${bahiaId} (pertenece al Apto ${parqueaderos[index].aptoAsignado}). Responsable: Apto ${aptoResponsable} (${nombreResponsable} - Tel: ${telefonoResponsable}).`,
        severidad: 'advertencia',
        guarda: req.user?.username || 'Guarda de Turno'
      });
      await saveMinuta(minuta);
    } catch (e) {}

    logger.info({ bahiaId, placa, aptoResponsable }, 'Invasión / Préstamo de bahía registrado');
    res.json(parqueaderos[index]);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al reportar parqueo en bahía ajena');
    res.status(500).json({ error: 'Error interno al registrar ocupación de bahía' });
  }
}

// ── REUBICAR VEHÍCULO INTRUSO A BAHÍA DE VISITANTES LIBRE ──
async function reubicarInvasion(req, res) {
  try {
    const parqueaderos = await getParqueaderos();
    const { bahiaPrivadaId, bahiaVisitanteDestinoId } = req.body;

    const privIdx = parqueaderos.findIndex(p => p.id === bahiaPrivadaId);
    if (privIdx === -1 || !parqueaderos[privIdx].invasion) {
      return res.status(404).json({ error: 'Bahía privada no tiene registro de vehículo intruso' });
    }

    const invasionData = { ...parqueaderos[privIdx].invasion };

    // Buscar bahía de visitantes destino
    let visIdx = -1;
    if (bahiaVisitanteDestinoId) {
      visIdx = parqueaderos.findIndex(p => p.id === bahiaVisitanteDestinoId && p.categoria === 'visitantes');
    } else {
      visIdx = parqueaderos.findIndex(p => p.categoria === 'visitantes' && p.estado === 'disponible');
    }

    if (visIdx === -1) {
      return res.status(400).json({ error: 'No hay bahías de visitantes disponibles para reubicar' });
    }

    // Ocupar bahía de visitantes
    parqueaderos[visIdx] = {
      ...parqueaderos[visIdx],
      estado: 'ocupado',
      placa: invasionData.placa,
      apto: invasionData.aptoResponsable,
      torre: invasionData.torreResponsable,
      horaIngreso: new Date().toISOString()
    };

    // Liberar bahía privada
    parqueaderos[privIdx].estado = 'libre';
    parqueaderos[privIdx].invasion = null;

    await saveParqueaderos(parqueaderos);

    logger.info({ bahiaPrivadaId, bahiaVisitanteId: parqueaderos[visIdx].id, placa: invasionData.placa }, 'Vehículo reubicado con éxito');
    res.json({
      message: `Vehículo ${invasionData.placa} movido exitosamente a la bahía de visitantes ${parqueaderos[visIdx].id}`,
      bahiaPrivada: parqueaderos[privIdx],
      bahiaVisitante: parqueaderos[visIdx]
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al reubicar vehículo');
    res.status(500).json({ error: 'Error interno al reubicar vehículo' });
  }
}

// ── LIBERAR BAHÍA PRIVADA INVADIDA (CUANDO SALE EL VEHÍCULO) ──
async function liberarInvasion(req, res) {
  try {
    const parqueaderos = await getParqueaderos();
    const { id } = req.params;

    const index = parqueaderos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía no encontrada' });
    }

    parqueaderos[index].estado = 'libre';
    parqueaderos[index].invasion = null;

    await saveParqueaderos(parqueaderos);
    res.json({ message: 'Bahía privada liberada exitosamente', bahia: parqueaderos[index] });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al liberar invasión');
    res.status(500).json({ error: 'Error interno al liberar bahía privada' });
  }
}

module.exports = {
  getAllParqueaderos,
  ocuparParqueadero,
  liberarParqueadero,
  reportarInvasion,
  reubicarInvasion,
  liberarInvasion
};