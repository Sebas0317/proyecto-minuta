'use strict';

const { getParqueaderos, saveParqueaderos, getMinuta, saveMinuta } = require('../data/jsonStore');
const { logger } = require('../utils/logger');

function isAvailableState(estado) {
  return estado === 'disponible' || estado === 'libre';
}

async function getAllParqueaderos(req, res) {
  try {
    const { categoria, estado } = req.query;
    const raw = await getParqueaderos();
    let parqueaderos = Array.isArray(raw) ? [...raw] : [];

    if (categoria) {
      parqueaderos = parqueaderos.filter(p => p.categoria === categoria);
    }
    if (estado) {
      if (isAvailableState(estado)) {
        parqueaderos = parqueaderos.filter(p => isAvailableState(p.estado));
      } else {
        parqueaderos = parqueaderos.filter(p => p.estado === estado);
      }
    }

    const isStaff = Boolean(req.user && ['owner', 'admin', 'supervisor', 'guarda', 'operator'].includes(req.user.role));
    if (!isStaff) {
      parqueaderos = parqueaderos.map((p) => {
        const safe = { ...p, placa: p.placa ? '***' : null };
        if (safe.invasion && typeof safe.invasion === 'object') {
          safe.invasion = { ...safe.invasion, telefonoResponsable: undefined, placa: '***' };
        }
        return safe;
      });
    }

    res.json(parqueaderos);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener parqueaderos');
    res.status(500).json({ error: 'Error interno al obtener parqueaderos' });
  }
}

async function ocuparParqueadero(req, res) {
  try {
    const raw = await getParqueaderos();
    const parqueaderos = Array.isArray(raw) ? [...raw] : [];
    const { id } = req.params;
    const { placa, tipo, unidadId, torre, apto } = req.body;

    const index = parqueaderos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía de parqueadero no encontrada' });
    }

    if (!placa || !torre || !apto) {
      return res.status(400).json({ error: 'Placa, Torre y Apartamento son requeridos' });
    }

    if (parqueaderos[index].estado === 'ocupado' || parqueaderos[index].estado === 'invadido') {
      return res.status(409).json({ error: 'La bahía seleccionada ya se encuentra ocupada' });
    }

    const torreStr = String(torre);
    const placaStr = String(placa).toUpperCase().trim();
    parqueaderos[index] = {
      ...parqueaderos[index],
      estado: 'ocupado',
      placa: placaStr,
      tipo: tipo || parqueaderos[index].tipo || 'carro',
      unidadId: unidadId || `${torreStr.toLowerCase().replace(/\s+/g, '')}-${apto}`,
      torre: torreStr,
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
    const { bahiaId, placa, aptoResponsable, torreResponsable, nombreResponsable, telefonoResponsable, motivo } = req.body;

    if (!bahiaId || !placa || !aptoResponsable) {
      return res.status(400).json({ error: 'Bahía, Placa y Apartamento Responsable son requeridos' });
    }

    const [parqueaderos, rawMinuta] = await Promise.all([
      getParqueaderos(),
      getMinuta().catch(() => null),
    ]);

    const index = parqueaderos.findIndex(p => p.id === bahiaId);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía privada no encontrada' });
    }

    const placaStr = String(placa).toUpperCase().trim();
    parqueaderos[index].estado = 'invadido';
    parqueaderos[index].invasion = {
      placa: placaStr,
      vehiculoTipo: 'carro',
      aptoResponsable: String(aptoResponsable),
      torreResponsable: torreResponsable || 'Torre 1',
      nombreResponsable: nombreResponsable || 'Visitante no identificado',
      telefonoResponsable: telefonoResponsable || 'No registrado',
      horaIngreso: new Date().toISOString(),
      motivo: motivo || 'Parqueado temporalmente en bahía ajena'
    };

    const writeTasks = [saveParqueaderos(parqueaderos)];

    if (Array.isArray(rawMinuta)) {
      const minuta = [...rawMinuta];
      minuta.unshift({
        id: `min-inv-${Date.now()}`,
        fecha: new Date().toISOString(),
        tipo: 'incidente',
        titulo: `⚠️ Vehículo parqueado en bahía privada ajena (${bahiaId})`,
        descripcion: `El vehículo placa ${placaStr} se estacionó en la bahía ${bahiaId} (pertenece al Apto ${parqueaderos[index].aptoAsignado || parqueaderos[index].apto || 'Privado'}). Responsable: Apto ${aptoResponsable} (${nombreResponsable || 'Visitante'} - Tel: ${telefonoResponsable || 'N/D'}).`,
        severidad: 'advertencia',
        guarda: req.user?.username || 'Guarda de Turno'
      });
      writeTasks.push(saveMinuta(minuta).catch(() => {}));
    }

    await Promise.all(writeTasks);

    logger.info({ bahiaId, placa: placaStr, aptoResponsable }, 'Invasión / Préstamo de bahía registrado');
    res.json(parqueaderos[index]);
  } catch (err) {
    logger.error({ error: err.message }, 'Error al reportar parqueo en bahía ajena');
    res.status(500).json({ error: 'Error interno al registrar ocupación de bahía' });
  }
}

// ── REUBICAR VEHÍCULO INTRUSO A BAHÍA DE VISITANTES LIBRE ──
async function reubicarInvasion(req, res) {
  try {
    const raw = await getParqueaderos();
    const parqueaderos = Array.isArray(raw) ? [...raw] : [];
    const { bahiaPrivadaId, bahiaVisitanteDestinoId } = req.body;

    const privIdx = parqueaderos.findIndex(p => p.id === bahiaPrivadaId);
    if (privIdx === -1 || !parqueaderos[privIdx].invasion) {
      return res.status(404).json({ error: 'Bahía privada no tiene registro de vehículo intruso' });
    }

    const invasionData = { ...parqueaderos[privIdx].invasion };

    // Buscar bahía de visitantes destino verificando disponibilidad
    let visIdx = -1;
    if (bahiaVisitanteDestinoId) {
      visIdx = parqueaderos.findIndex(
        p => p.id === bahiaVisitanteDestinoId && p.categoria === 'visitantes' && isAvailableState(p.estado)
      );
      if (visIdx === -1) {
        return res.status(409).json({ error: 'La bahía de visitantes destino no está disponible' });
      }
    } else {
      visIdx = parqueaderos.findIndex(p => p.categoria === 'visitantes' && isAvailableState(p.estado));
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

    // Liberar bahía privada con estado unificado
    parqueaderos[privIdx].estado = 'disponible';
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
    const raw = await getParqueaderos();
    const parqueaderos = Array.isArray(raw) ? [...raw] : [];
    const { id } = req.params;

    const index = parqueaderos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bahía no encontrada' });
    }

    parqueaderos[index].estado = 'disponible';
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