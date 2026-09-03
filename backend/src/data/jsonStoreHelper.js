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
  const candidates = [
    filePath,
    path.join(DATA_DIR, name),
    path.join(DEPLOY_DIR, name),
    path.join(process.cwd(), name),
    path.join(process.cwd(), 'backend', name),
    path.join(__dirname, '..', '..', name),
    path.join(__dirname, '..', '..', 'backend', name),
  ];

  let fallbackEmpty = null;

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, 'utf8');
      const data = JSON.parse(raw);
      if (data !== null && data !== undefined) {
        if (Array.isArray(data)) {
          if (data.length > 0) return data;
          fallbackEmpty = data;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          return data;
        } else {
          fallbackEmpty = data;
        }
      }
    } catch {
      // Continue searching next candidate path
    }
  }

  return fallbackEmpty !== null ? fallbackEmpty : defaultVal;
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
