'use strict';

const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const { readJsonFile, writeJsonFile } = require('../data/jsonStoreHelper');
const { logger } = require('./logger');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const DATA_DIR = path.join(__dirname, '../..');
const BACKUP_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), 'ecobosque-backups')
  : path.join(DATA_DIR, 'backups');

const JSON_FILES = [
  'unidades.json',
  'minuta.json',
  'paquetes.json',
  'accesos.json',
  'parqueaderos.json',
  'trasteos.json',
  'users.json',
  'asambleas.json',
  'pqrs.json',
  'rondas.json',
  'equipos_emergencia.json',
  'mascotas.json',
  'reservas_zonas.json',
  'chatbot_knowledge.json',
  'manual_convivencia.json',
  'consultas_analytics.json',
];

async function validateAll() {
  const files = {};
  let validCount = 0;

  await Promise.all(
    JSON_FILES.map(async (filename) => {
      const filePath = path.join(DATA_DIR, filename);
      try {
        const data = await readJsonFile(filePath, undefined);
        const valid = data !== undefined && data !== null;
        if (valid) validCount += 1;
        files[filename] = {
          exists: valid,
          valid,
          records: Array.isArray(data) ? data.length : valid ? 1 : 0,
        };
      } catch (err) {
        files[filename] = {
          exists: false,
          valid: false,
          error: err.message,
        };
      }
    })
  );

  return {
    overall: validCount === JSON_FILES.length,
    total: JSON_FILES.length,
    valid: validCount,
    files,
  };
}

async function validateAllJsonFiles() {
  const report = await validateAll();
  const errors = Object.entries(report.files)
    .filter(([, info]) => !info.valid)
    .map(([file, info]) => ({ file, error: info.error || 'Invalid or missing JSON' }));
  return {
    total: report.total,
    valid: report.valid,
    errors,
  };
}

async function repairFromBackup(filename) {
  try {
    const dirs = await fs.readdir(BACKUP_DIR).catch(() => []);
    const sorted = dirs.filter((d) => /^\d{4}-\d{2}-\d{2}T/.test(d)).sort().reverse();
    for (const dir of sorted) {
      const candidate = path.join(BACKUP_DIR, dir, filename);
      try {
        const raw = await fs.readFile(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        await writeJsonFile(path.join(DATA_DIR, filename), parsed);
        logger.info({ file: filename, backup: dir }, 'Repaired JSON file from backup');
        return { repaired: true, fromBackup: dir };
      } catch {
        // Try older backup
      }
    }
    return { repaired: false, reason: 'No valid backup found' };
  } catch (err) {
    return { repaired: false, reason: err.message };
  }
}

module.exports = {
  validateAll,
  validateAllJsonFiles,
  repairFromBackup,
  startupValidation: validateAllJsonFiles,
  JSON_FILES,
};
