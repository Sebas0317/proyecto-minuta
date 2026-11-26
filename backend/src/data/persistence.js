'use strict';

/**
 * Proyecto Minuta - Sistema de Portería y Vigilancia Residencial
 * Persistence layer: abstracts storage between local JSON files and Upstash Redis.
 *
 * In production (Vercel): uses Upstash Redis via KV_REST_API_URL or UPSTASH_REDIS_REST_URL with fast circuit-breaker fallback.
 * In development/local: uses file-based JSON storage.
 */

const path = require('node:path');
const { readJsonFile, writeJsonFile } = require('./jsonStoreHelper');
const { logger } = require('../utils/logger');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const REDIS_COOLDOWN_MS = 30000;

// ── Redis client (lazy init + fast circuit breaker) ──
let redis = null;
let redisCircuitOpenUntil = 0;

function getRedis() {
  if (Date.now() < redisCircuitOpenUntil) return null;
  if (redis) return redis;
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const { Redis } = require('@upstash/redis');
    const timeoutFetch = (url, init) =>
      fetch(url, { ...init, signal: AbortSignal.timeout(2000) });
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
      fetch: timeoutFetch,
      retry: { retries: 1, backoff: () => 100 },
    });
    logger.info('Using Upstash Redis for persistence in Minuta Residencial');
  }
  return redis;
}

function tripRedisCircuit(err, key) {
  redisCircuitOpenUntil = Date.now() + REDIS_COOLDOWN_MS;
  logger.warn({ err: err?.message || err, key }, 'Redis unreachable — circuit open for 30s, using local fallback');
}

function isRedisAvailable() {
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(redisUrl && redisToken) && Date.now() >= redisCircuitOpenUntil;
}

function cloneValue(val) {
  if (val === null || val === undefined || typeof val !== 'object') return val;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(val);
    } catch {
      // Fallback below
    }
  }
  return JSON.parse(JSON.stringify(val));
}

// ── File paths (used as Redis keys) ──
const DATA_DIR = path.resolve(__dirname, '..', '..');
const UNIDADES_KEY = 'data:unidades';
const MINUTA_KEY = 'data:minuta';
const PAQUETES_KEY = 'data:paquetes';
const ACCESOS_KEY = 'data:accesos';
const TRASTEOS_KEY = 'data:trasteos';
const PARQUEADEROS_KEY = 'data:parqueaderos';
const ASAMBLEAS_KEY = 'data:asambleas';
const PQRS_KEY = 'data:pqrs';
const RONDAS_KEY = 'data:rondas';
const RESERVAS_ZONAS_KEY = 'data:reservas_zonas';
const EQUIPOS_KEY = 'data:equipos_emergencia';
const MASCOTAS_KEY = 'data:mascotas';
const CHATBOT_KNOWLEDGE_KEY = 'data:chatbot_knowledge';
const UNANSWERED_QUESTIONS_KEY = 'data:unanswered_questions';
const CONSULTAS_ANALYTICS_KEY = 'data:consultas_analytics';
const ROOMS_KEY = 'data:rooms';
const CONSUMOS_KEY = 'data:consumos';
const USERS_KEY = 'data:users';
const HISTORY_KEY = 'data:history';
const STATE_HISTORY_KEY = 'data:stateHistory';
const PRICES_KEY = 'data:prices';
const RESERVAS_KEY = 'data:reservas';
const CODES_KEY = 'data:codes';
const SECURITY_ATTEMPTS_KEY = 'data:security:attempts';
const SECURITY_EVENTS_KEY = 'data:security:events';
const STATE_KEY = 'data:state';

// ── In-memory fallback (for serverless where Redis is unavailable) ──
const memoryStore = new Map();
const initializedKeys = new Set();
const dirtyKeys = new Set();
const deletedKeys = new Set();

// Track which keys have been lazily bootstrapped from files
const bootstrapped = new Map();

// Per-key write lock to prevent lost updates
const writeLocks = new Map();
function withWriteLock(key, fn) {
  const prev = writeLocks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(key, next);
  next
    .finally(() => {
      if (writeLocks.get(key) === next) {
        writeLocks.delete(key);
      }
    })
    .catch(() => {});
  return next;
}

// ── Public API ──

async function getData(key, defaultVal = null) {
  const r = getRedis();
  if (r) {
    try {
      if (deletedKeys.has(key)) {
        await r.del(key);
        deletedKeys.delete(key);
      } else if (dirtyKeys.has(key) && memoryStore.has(key)) {
        const localFresh = memoryStore.get(key);
        await r.set(key, localFresh);
        dirtyKeys.delete(key);
        return cloneValue(localFresh);
      }
      const val = await r.get(key);
      if (val !== null && val !== undefined) {
        memoryStore.set(key, val);
        initializedKeys.add(key);
        return cloneValue(val);
      }
    } catch (err) {
      tripRedisCircuit(err, key);
    }
  }

  // Check in-memory fallback
  if (memoryStore.has(key)) {
    const mem = memoryStore.get(key);
    if (!Array.isArray(mem) || mem.length > 0 || initializedKeys.has(key)) {
      return cloneValue(mem);
    }
  }

  // Lazy bootstrap: seed from file (also runs without Redis for local dev)
  if (!bootstrapped.has(key)) {
    bootstrapped.set(
      key,
      (async () => {
        const file = fileForKey(key);
        if (file) {
          try {
            const data = await readJsonFile(file, null);
            if (data !== null) {
              memoryStore.set(key, data);
              initializedKeys.add(key);
              const activeRedis = getRedis();
              if (activeRedis) {
                await activeRedis.set(key, data).catch((err) => tripRedisCircuit(err, key));
              }
              logger.info(`Lazy-seeded ${key} from ${path.basename(file)} (${Array.isArray(data) ? data.length : 'obj'})`);
              return data;
            }
          } catch {
            // File missing or unreadable, use default
          }
        }
        return defaultVal;
      })()
    );
  }

  const result = await bootstrapped.get(key);
  if (memoryStore.has(key)) return cloneValue(memoryStore.get(key));
  return result !== null && result !== undefined ? cloneValue(result) : cloneValue(defaultVal);
}

async function _setData(key, data) {
  const snapshot = cloneValue(data);
  const r = getRedis();
  let redisOk = false;
  if (r) {
    try {
      await r.set(key, snapshot);
      redisOk = true;
    } catch (err) {
      tripRedisCircuit(err, key);
    }
  }

  // On Vercel, skip redundant /tmp file writes when Redis already persisted the data.
  // Locally (or when Redis is unavailable/down), persist to JSON file for durability.
  const file = fileForKey(key);
  let fileOk = false;
  if (file && (!IS_VERCEL || !redisOk)) {
    try {
      await writeJsonFile(file, snapshot);
      fileOk = true;
    } catch (err) {
      logger.warn({ err, key, file }, 'File write failed');
    }
  }

  if (redisOk || fileOk || (!r && file)) {
    memoryStore.set(key, snapshot);
    initializedKeys.add(key);
    deletedKeys.delete(key);
    if (redisOk) {
      dirtyKeys.delete(key);
    } else if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      dirtyKeys.add(key);
    }
  } else if (memoryStore.has(key)) {
    logger.warn(
      { key },
      'All persistent stores failed — keeping previous in-memory state'
    );
  }
}

async function setData(key, data) {
  return withWriteLock(key, () => _setData(key, data));
}

async function _delData(key) {
  memoryStore.delete(key);
  initializedKeys.delete(key);
  dirtyKeys.delete(key);
  const r = getRedis();
  if (r) {
    try {
      await r.del(key);
      deletedKeys.delete(key);
    } catch (err) {
      deletedKeys.add(key);
      tripRedisCircuit(err, key);
    }
  } else if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
    deletedKeys.add(key);
  }
}

// ── Map Redis keys back to file paths for lazy bootstrap ──
function fileForKey(key) {
  const map = {
    [UNIDADES_KEY]: 'unidades.json',
    [MINUTA_KEY]: 'minuta.json',
    [PAQUETES_KEY]: 'paquetes.json',
    [ACCESOS_KEY]: 'accesos.json',
    [TRASTEOS_KEY]: 'trasteos.json',
    [PARQUEADEROS_KEY]: 'parqueaderos.json',
    [ASAMBLEAS_KEY]: 'asambleas.json',
    [PQRS_KEY]: 'pqrs.json',
    [RONDAS_KEY]: 'rondas.json',
    [RESERVAS_ZONAS_KEY]: 'reservas_zonas.json',
    [EQUIPOS_KEY]: 'equipos_emergencia.json',
    [MASCOTAS_KEY]: 'mascotas.json',
    [CHATBOT_KNOWLEDGE_KEY]: 'chatbot_knowledge.json',
    [UNANSWERED_QUESTIONS_KEY]: 'unanswered_questions.json',
    [CONSULTAS_ANALYTICS_KEY]: 'consultas_analytics.json',
    [ROOMS_KEY]: 'rooms.json',
    [CONSUMOS_KEY]: 'consumos.json',
    [USERS_KEY]: 'users.json',
    [HISTORY_KEY]: 'history.json',
    [STATE_HISTORY_KEY]: 'stateHistory.json',
    [PRICES_KEY]: 'prices.json',
    [RESERVAS_KEY]: 'reservas.json',
    [CODES_KEY]: 'codes.json',
    [SECURITY_ATTEMPTS_KEY]: 'security-attempts.json',
    [SECURITY_EVENTS_KEY]: 'security-events.json',
    [STATE_KEY]: 'state.json',
  };
  const name = map[key];
  return name ? path.join(DATA_DIR, name) : null;
}

// ── MINUTA & RESIDENTIAL SYSTEM HELPERS ──
async function getUnidades() {
  return getData(UNIDADES_KEY, []);
}
async function setUnidades(data) {
  return setData(UNIDADES_KEY, data);
}

async function getMinuta() {
  return getData(MINUTA_KEY, []);
}
async function setMinuta(data) {
  return setData(MINUTA_KEY, data);
}

async function getPaquetes() {
  return getData(PAQUETES_KEY, []);
}
async function setPaquetes(data) {
  return setData(PAQUETES_KEY, data);
}

async function getAccesos() {
  return getData(ACCESOS_KEY, []);
}
async function setAccesos(data) {
  return setData(ACCESOS_KEY, data);
}

async function getTrasteos() {
  return getData(TRASTEOS_KEY, []);
}
async function setTrasteos(data) {
  return setData(TRASTEOS_KEY, data);
}

async function getParqueaderos() {
  return getData(PARQUEADEROS_KEY, []);
}
async function setParqueaderos(data) {
  return setData(PARQUEADEROS_KEY, data);
}

async function getAsambleas() {
  return getData(ASAMBLEAS_KEY, []);
}
async function setAsambleas(data) {
  return setData(ASAMBLEAS_KEY, data);
}

async function getPqrs() {
  return getData(PQRS_KEY, []);
}
async function setPqrs(data) {
  return setData(PQRS_KEY, data);
}

async function getRondas() {
  return getData(RONDAS_KEY, { puntosControl: [], rondas: [] });
}
async function setRondas(data) {
  return setData(RONDAS_KEY, data);
}

async function getReservasZonas() {
  return getData(RESERVAS_ZONAS_KEY, []);
}
async function setReservasZonas(data) {
  return setData(RESERVAS_ZONAS_KEY, data);
}

async function getEquipos() {
  return getData(EQUIPOS_KEY, []);
}
async function setEquipos(data) {
  return setData(EQUIPOS_KEY, data);
}

async function getMascotas() {
  return getData(MASCOTAS_KEY, []);
}
async function setMascotas(data) {
  return setData(MASCOTAS_KEY, data);
}

async function getChatbotKnowledge() {
  return getData(CHATBOT_KNOWLEDGE_KEY, []);
}
async function setChatbotKnowledge(data) {
  return setData(CHATBOT_KNOWLEDGE_KEY, data);
}

async function getUnansweredQuestions() {
  return getData(UNANSWERED_QUESTIONS_KEY, []);
}
async function setUnansweredQuestions(data) {
  return setData(UNANSWERED_QUESTIONS_KEY, data);
}

async function getConsultasAnalytics() {
  return getData(CONSULTAS_ANALYTICS_KEY, { totalConsultas: 0, categorias: {}, historico: [] });
}
async function setConsultasAnalytics(data) {
  return setData(CONSULTAS_ANALYTICS_KEY, data);
}

async function getRooms() {
  return getData(ROOMS_KEY, []);
}
async function setRooms(data) {
  return setData(ROOMS_KEY, data);
}

async function getConsumos() {
  return getData(CONSUMOS_KEY, []);
}
async function setConsumos(data) {
  return setData(CONSUMOS_KEY, data);
}

async function getUsers() {
  return getData(USERS_KEY, []);
}
async function setUsers(data) {
  return setData(USERS_KEY, data);
}

async function getHistory() {
  return getData(HISTORY_KEY, []);
}
async function setHistory(data) {
  return setData(HISTORY_KEY, data);
}

async function getStateHistory() {
  return getData(STATE_HISTORY_KEY, []);
}
async function setStateHistory(data) {
  return setData(STATE_HISTORY_KEY, data);
}

async function getPrices() {
  return getData(PRICES_KEY, {});
}
async function setPrices(data) {
  return setData(PRICES_KEY, data);
}

async function getReservas() {
  return getData(RESERVAS_KEY, []);
}
async function setReservas(data) {
  return setData(RESERVAS_KEY, data);
}

async function getCodes() {
  return getData(CODES_KEY, {});
}
async function setCodes(data) {
  return setData(CODES_KEY, data);
}

async function getSecurityAttempts() {
  return getData(SECURITY_ATTEMPTS_KEY, []);
}
async function setSecurityAttempts(data) {
  return setData(SECURITY_ATTEMPTS_KEY, data);
}

async function getSecurityEvents() {
  return getData(SECURITY_EVENTS_KEY, []);
}
async function setSecurityEvents(data) {
  return setData(SECURITY_EVENTS_KEY, data);
}

async function getState() {
  return getData(STATE_KEY, {});
}
async function setState(data) {
  return setData(STATE_KEY, data);
}

// ── Bootstrap: seed from JSON files on first run (parallelized) ──
async function bootstrapFromFiles() {
  if (!isRedisAvailable()) return;
  const r = getRedis();
  if (!r) return;

  const fileKeyPairs = [
    { file: path.join(DATA_DIR, 'unidades.json'), key: UNIDADES_KEY },
    { file: path.join(DATA_DIR, 'minuta.json'), key: MINUTA_KEY },
    { file: path.join(DATA_DIR, 'paquetes.json'), key: PAQUETES_KEY },
    { file: path.join(DATA_DIR, 'accesos.json'), key: ACCESOS_KEY },
    { file: path.join(DATA_DIR, 'trasteos.json'), key: TRASTEOS_KEY },
    { file: path.join(DATA_DIR, 'parqueaderos.json'), key: PARQUEADEROS_KEY },
    { file: path.join(DATA_DIR, 'asambleas.json'), key: ASAMBLEAS_KEY },
    { file: path.join(DATA_DIR, 'pqrs.json'), key: PQRS_KEY },
    { file: path.join(DATA_DIR, 'rondas.json'), key: RONDAS_KEY },
    { file: path.join(DATA_DIR, 'reservas_zonas.json'), key: RESERVAS_ZONAS_KEY },
    { file: path.join(DATA_DIR, 'equipos_emergencia.json'), key: EQUIPOS_KEY },
    { file: path.join(DATA_DIR, 'mascotas.json'), key: MASCOTAS_KEY },
    { file: path.join(DATA_DIR, 'chatbot_knowledge.json'), key: CHATBOT_KNOWLEDGE_KEY },
    { file: path.join(DATA_DIR, 'unanswered_questions.json'), key: UNANSWERED_QUESTIONS_KEY },
    { file: path.join(DATA_DIR, 'consultas_analytics.json'), key: CONSULTAS_ANALYTICS_KEY },
    { file: path.join(DATA_DIR, 'users.json'), key: USERS_KEY },
    { file: path.join(DATA_DIR, 'history.json'), key: HISTORY_KEY },
    { file: path.join(DATA_DIR, 'stateHistory.json'), key: STATE_HISTORY_KEY },
    { file: path.join(DATA_DIR, 'codes.json'), key: CODES_KEY },
  ];

  await Promise.all(
    fileKeyPairs.map(async ({ file, key }) => {
      try {
        const exists = await r.exists(key);
        if (!exists) {
          const data = await readJsonFile(file, null);
          if (data !== null) {
            await r.set(key, data);
            logger.info(`Seeded Redis key ${key} from ${path.basename(file)}`);
          }
        }
      } catch (err) {
        tripRedisCircuit(err, key);
      }
    })
  );
}

// Per-key transaction lock for multi-step read-modify-write callers
const txLocks = new Map();
function withKeyLock(key, fn) {
  const prev = txLocks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  txLocks.set(key, next);
  next
    .finally(() => {
      if (txLocks.get(key) === next) {
        txLocks.delete(key);
      }
    })
    .catch(() => {});
  return next;
}

module.exports = {
  withKeyLock,
  getUnidades,
  setUnidades,
  getMinuta,
  setMinuta,
  getPaquetes,
  setPaquetes,
  getAccesos,
  setAccesos,
  getTrasteos,
  setTrasteos,
  getParqueaderos,
  setParqueaderos,
  getAsambleas,
  setAsambleas,
  getPqrs,
  setPqrs,
  getRondas,
  setRondas,
  getReservasZonas,
  setReservasZonas,
  getEquipos,
  setEquipos,
  getMascotas,
  setMascotas,
  getChatbotKnowledge,
  setChatbotKnowledge,
  getUnansweredQuestions,
  setUnansweredQuestions,
  getConsultasAnalytics,
  setConsultasAnalytics,
  isRedisAvailable,
  bootstrapFromFiles,
  getRooms,
  setRooms,
  getConsumos,
  setConsumos,
  getUsers,
  setUsers,
  getHistory,
  setHistory,
  getStateHistory,
  setStateHistory,
  getPrices,
  setPrices,
  getReservas,
  setReservas,
  getCodes,
  setCodes,
  getSecurityAttempts,
  setSecurityAttempts,
  getSecurityEvents,
  setSecurityEvents,
  getState,
  setState,
  ROOMS_KEY,
  CONSUMOS_KEY,
  USERS_KEY,
};
