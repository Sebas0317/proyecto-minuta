'use strict';

const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const logger = require('../utils/logger');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const DEPLOY_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), 'ecobosque-data')
  : DEPLOY_DIR;

// Ensure writable data dir exists (async, non-blocking)
fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

// Per-file write queue to serialize concurrent writes and prevent temp-file rename races
const fileWriteLocks = new Map();
function withFileLock(targetPath, fn) {
  const prev = fileWriteLocks.get(targetPath) || Promise.resolve();
  const next = prev.then(fn, fn);
  fileWriteLocks.set(targetPath, next);
  next
    .finally(() => {
      if (fileWriteLocks.get(targetPath) === next) {
        fileWriteLocks.delete(targetPath);
      }
    })
    .catch(() => {});
  return next;
}

// Static requires ensure Vercel NFT bundles every JSON file into production lambda
const BUNDLED_DATA = {
  'unidades.json': () => require('../../unidades.json'),
  'minuta.json': () => require('../../minuta.json'),
  'paquetes.json': () => require('../../paquetes.json'),
  'accesos.json': () => require('../../accesos.json'),
  'trasteos.json': () => require('../../trasteos.json'),
  'parqueaderos.json': () => require('../../parqueaderos.json'),
  'mascotas.json': () => require('../../mascotas.json'),
  'equipos.json': () => require('../../equipos.json'),
  'equipos_emergencia.json': () => require('../../equipos_emergencia.json'),
  'asambleas.json': () => require('../../asambleas.json'),
  'pqrs.json': () => require('../../pqrs.json'),
  'reservas_zonas.json': () => require('../../reservas_zonas.json'),
  'rondas.json': () => require('../../rondas.json'),
  'chatbot_knowledge.json': () => require('../../chatbot_knowledge.json'),
  'unanswered_questions.json': () => require('../../unanswered_questions.json'),
  'manual_convivencia.json': () => require('../../manual_convivencia.json'),
  'consultas_analytics.json': () => require('../../consultas_analytics.json'),
  'knowledge_base.json': () => require('../../knowledge_base.json'),
  'users.json': () => require('../../users.json'),
  'admins.json': () => require('../../admins.json'),
  'history.json': () => require('../../history.json'),
  'stateHistory.json': () => require('../../stateHistory.json'),
  'codes.json': () => require('../../codes.json'),
  'security-attempts.json': () => require('../../security-attempts.json'),
  'security-events.json': () => require('../../security-events.json'),
};

function isWithinDir(baseDir, targetPath) {
  return targetPath === baseDir || targetPath.startsWith(baseDir + path.sep);
}

function validatePath(filePath) {
  const resolved = path.resolve(filePath);
  if (!isWithinDir(DATA_DIR, resolved) && !isWithinDir(DEPLOY_DIR, resolved)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

async function readJsonFile(filePath, defaultVal = null) {
  validatePath(filePath);
  const name = path.basename(filePath);

  // 1. Try writable DATA_DIR (/tmp on Vercel, DEPLOY_DIR locally) first
  try {
    const writablePath = path.join(DATA_DIR, name);
    const raw = await fs.readFile(writablePath, 'utf8');
    const data = JSON.parse(raw);
    if (data !== null && data !== undefined) {
      return data;
    }
  } catch {
    // Continue to bundled / disk fallback
  }

  // 2. Try bundled static require (important on Vercel cold starts before any /tmp write)
  if (BUNDLED_DATA[name]) {
    try {
      const data = BUNDLED_DATA[name]();
      if (data !== null && data !== undefined) {
        return JSON.parse(JSON.stringify(data));
      }
    } catch {
      // Continue
    }
  }

  // 3. Candidate disk paths
  const candidates = [
    filePath,
    path.join(DEPLOY_DIR, name),
    path.join(process.cwd(), name),
    path.join(process.cwd(), 'backend', name),
    path.join(__dirname, '..', '..', name),
    path.join(__dirname, '..', '..', 'backend', name),
  ];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, 'utf8');
      const data = JSON.parse(raw);
      if (data !== null && data !== undefined) {
        return data;
      }
    } catch {
      // Try next
    }
  }

  return defaultVal;
}

async function writeJsonFile(filePath, data) {
  const resolved = validatePath(filePath);
  // On Vercel, DEPLOY_DIR is read-only (EROFS); redirect writes to writable DATA_DIR (/tmp)
  const targetPath = IS_VERCEL
    ? path.join(DATA_DIR, path.basename(resolved))
    : resolved;

  return withFileLock(targetPath, async () => {
    const uniqueSuffix = `${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    const tmp = `${targetPath}.${uniqueSuffix}.tmp`;
    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const serialized = IS_VERCEL ? JSON.stringify(data) : JSON.stringify(data, null, 2);
      await fs.writeFile(tmp, serialized, 'utf8');

      let renamed = false;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          await fs.rename(tmp, targetPath);
          renamed = true;
          break;
        } catch (renameErr) {
          if (
            (renameErr.code === 'EPERM' || renameErr.code === 'EBUSY' || renameErr.code === 'EACCES') &&
            attempt < 4
          ) {
            await new Promise((r) => setTimeout(r, 15 * attempt));
            continue;
          }
          if (renameErr.code === 'EPERM' || renameErr.code === 'EBUSY' || renameErr.code === 'EACCES') {
            await fs.writeFile(targetPath, serialized, 'utf8');
            await fs.unlink(tmp).catch(() => {});
            renamed = true;
            break;
          }
          throw renameErr;
        }
      }
      if (!renamed) {
        await fs.writeFile(targetPath, serialized, 'utf8');
        await fs.unlink(tmp).catch(() => {});
      }
    } catch (err) {
      await fs.unlink(tmp).catch(() => {});
      logger.warn({ err, file: targetPath }, 'Error writing JSON file');
      throw err;
    }
  });
}

module.exports = { readJsonFile, writeJsonFile, DATA_DIR, DEPLOY_DIR };
