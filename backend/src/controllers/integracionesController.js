'use strict';

const {
  getColombianHolidays,
  getBogotaDateParts,
  calcularPicoYPlacaBogota,
} = require('../utils/colombianHolidays');
const { logger } = require('../utils/logger');

let weatherCache = { data: null, fetchedAt: 0 };
let trmCache = { value: 4150, source: 'referencia_local', fetchedAt: 0 };

const WEATHER_TTL_MS = 10 * 60 * 1000; // 10 min
const TRM_TTL_MS = 60 * 60 * 1000; // 1 hora

function describeWeatherCode(code, precipitation = 0) {
  if (precipitation > 0.5 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      estado: 'Lluvia en Bogotá',
      icono: 'lluvia',
      protocoloPorteria:
        'Activar tapetes antideslizantes en recepción, priorizar espera bajo techo para domiciliarios y supervisar drenajes.',
    };
  }
  if (code >= 95) {
    return {
      estado: 'Tormenta Eléctrica',
      icono: 'tormenta',
      protocoloPorteria:
        'Cierre preventivo de piscina y canchas descubiertas; verificar estado de planta eléctrica de emergencia.',
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      estado: 'Parcialmente Nublado',
      icono: 'nublado',
      protocoloPorteria: 'Operación normal en portería, rondas perimetrales y zonas comunes exteriores.',
    };
  }
  return {
    estado: 'Cielo Despejado',
    icono: 'despejado',
    protocoloPorteria: 'Zonas recreativas exteriores, BBQ y parqueaderos operando con normalidad.',
  };
}

async function fetchBogotaWeather() {
  if (weatherCache.data && Date.now() - weatherCache.fetchedAt < WEATHER_TTL_MS) {
    return weatherCache.data;
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=4.6097&longitude=-74.0817&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=America%2FBogota';
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        const current = json.current || {};
        const probs = Array.isArray(json.hourly?.precipitation_probability)
          ? json.hourly.precipitation_probability
          : [];
        const maxRainProb = probs.length ? Math.max(...probs.slice(0, 12)) : 20;
        const desc = describeWeatherCode(current.weather_code ?? 2, current.precipitation ?? 0);

        const payload = {
          ciudad: 'Bogotá D.C.',
          temperaturaC: Math.round((current.temperature_2m ?? 15) * 10) / 10,
          precipitacionMm: current.precipitation ?? 0,
          vientoKmh: Math.round(current.wind_speed_10m ?? 8),
          probabilidadLluviaPct: maxRainProb,
          ...desc,
          fuente: 'open-meteo.com',
        };
        weatherCache = { data: payload, fetchedAt: Date.now() };
        return payload;
      }
    } catch (err) {
      logger.debug({ err: err?.message }, 'Open-Meteo fallback activated');
    }
  }

  const fallback = {
    ciudad: 'Bogotá D.C.',
    temperaturaC: 15,
    precipitacionMm: 0,
    vientoKmh: 9,
    probabilidadLluviaPct: 25,
    ...describeWeatherCode(2, 0),
    fuente: 'contingencia_local',
  };
  weatherCache = { data: fallback, fetchedAt: Date.now() };
  return fallback;
}

async function fetchTrmCop() {
  if (Date.now() - trmCache.fetchedAt < TRM_TTL_MS) {
    return trmCache;
  }
  if (process.env.NODE_ENV !== 'test') {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = await res.json();
        const cop = Math.round(Number(json?.rates?.COP) || 4150);
        trmCache = { value: cop, source: 'open.er-api.com', fetchedAt: Date.now() };
        return trmCache;
      }
    } catch {
      // Keep fallback
    }
  }
  trmCache = { ...trmCache, fetchedAt: Date.now() };
  return trmCache;
}

async function getContextoOperativo(_req, res) {
  try {
    const now = new Date();
    const { year, ymd, dow } = getBogotaDateParts(now);

    const [weather, festivosAnio, festivosSigAnio, trm] = await Promise.all([
      fetchBogotaWeather(),
      getColombianHolidays(year),
      getColombianHolidays(year + 1),
      fetchTrmCop(),
    ]);

    const todosFestivos = [...festivosAnio, ...festivosSigAnio];
    const festivoHoy = todosFestivos.find((f) => f.date === ymd) || null;
    const proximoFestivo = todosFestivos.find((f) => f.date > ymd) || null;
    const picoYPlaca = calcularPicoYPlacaBogota(now);

    // Art. 24 Manual de Convivencia: Mudanzas lunes a sábado 8:00 AM - 5:00 PM (prohibidas domingos y festivos)
    const mudanzasHabilitadasHoy = dow !== 0 && !festivoHoy;

    res.json({
      fechaBogota: ymd,
      clima: weather,
      picoYPlaca,
      calendario: {
        esDomingo: dow === 0,
        esFestivoHoy: Boolean(festivoHoy),
        festivoHoy: festivoHoy?.name || null,
        proximoFestivo,
        mudanzasHabilitadasHoy,
        reglaMudanzas: mudanzasHabilitadasHoy
          ? 'Mudanzas permitidas hoy (08:00 AM - 05:00 PM con Paz y Salvo)'
          : 'Mudanzas restringidas hoy por domingo/festivo (Art. 24 Manual de Convivencia)',
      },
      indicadores: {
        trmCop: trm.value,
        fuenteTrm: trm.source,
      },
      timestamp: now.toISOString(),
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Error al obtener contexto operativo');
    res.status(500).json({ error: 'Error al consultar integraciones operativas' });
  }
}

async function getFestivosHandler(req, res) {
  try {
    const year = Number(req.query.year) || getBogotaDateParts(new Date()).year;
    const festivos = await getColombianHolidays(year);
    const { ymd } = getBogotaDateParts(new Date());
    res.json({
      year,
      total: festivos.length,
      proximoFestivo: festivos.find((f) => f.date >= ymd) || null,
      festivos,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar calendario de festivos' });
  }
}

module.exports = {
  getContextoOperativo,
  getFestivosHandler,
  fetchBogotaWeather,
};
