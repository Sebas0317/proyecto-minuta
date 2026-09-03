'use strict';

const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const logger = require('../utils/logger');

const DEPLOY_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = process.env.VERCEL_ENV
  ? path.join(os.tmpdir(), 'ecobosque-data')
  : DEPLOY_DIR;

// Ensure writable data dir exists (async, non-blocking)
fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

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
  'asambleas.json': () => require('../../asambleas.json'),
  'reservas_zonas.json': () => require('../../reservas_zonas.json'),
  'rondas.json': () => require('../../rondas.json'),
  'rooms.json': () => require('../../rooms.json'),
  'consumos.json': () => require('../../consumos.json'),
  'users.json': () => require('../../users.json'),
  'history.json': () => require('../../history.json'),
  'stateHistory.json': () => require('../../stateHistory.json'),
  'prices.json': () => require('../../prices.json'),
  'reservas.json': () => require('../../reservas.json'),
  'codes.json': () => require('../../codes.json'),
};

function validatePath(filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(DATA_DIR) && !resolved.startsWith(DEPLOY_DIR)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

function deployPath(filePath) {
  const name = path.basename(filePath);
  return path.join(DEPLOY_DIR, name);
}

async function readJsonFile(filePath, defaultVal = null) {
  validatePath(filePath);
  const name = path.basename(filePath);

  // 1. Try writable DATA_DIR (/tmp on Vercel) first
  try {
    const tmpPath = path.join(DATA_DIR, name);
    const raw = await fs.readFile(tmpPath, 'utf8');
    const data = JSON.parse(raw);
    if (data !== null && data !== undefined) {
      if (!Array.isArray(data) || data.length > 0) {
        return data;
      }
    }
  } catch {
    // Continue
  }

  // 2. Try bundled static require
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
        if (!Array.isArray(data) || data.length > 0) {
          return data;
        }
      }
    } catch {
      // Try next
    }
  }

  return defaultVal;
}

async function writeJsonFile(filePath, data) {
  const resolved = validatePath(filePath);
  const tmp = `${resolved}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    let fd = null;
    try {
      fd = await fs.open(tmp, 'r');
      if (process.platform !== 'win32') {
        await fd.sync();
      } else {
        logger.debug({ file: tmp }, 'fsync skipped on Windows');
      }
    } catch (syncErr) {
      logger.warn({ err: syncErr, file: tmp }, 'fsync skipped');
    } finally {
      if (fd) await fd.close().catch(() => {});
    }
    await fs.rename(tmp, resolved);
  } catch (err) {
    logger.warn({ err, file: filePath }, 'Error writing JSON file');
    throw err;
  }
}

module.exports = { readJsonFile, writeJsonFile };
