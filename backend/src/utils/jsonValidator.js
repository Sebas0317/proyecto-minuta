'use strict';

const fs = require('node:fs').promises;
const path = require('node:path');
const { logger } = require('./logger');

const DATA_DIR = path.join(__dirname, '../..');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const JSON_FILES = [
  'unidades.json',
  'minuta.json',
  'paquetes.json',
  'accesos.json',
  'parqueaderos.json',
  'trasteos.json',
  'users.json',
  'chatbot_knowledge.json',
  'history.json',
  'stateHistory.json'
];
const MAX_BACKUPS = 10;

async function validateAllJsonFiles() {
  const results = { total: JSON_FILES.length, valid: 0, errors: [] };

  for (const filename of JSON_FILES) {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!exists) {
        await fs.writeFile(filePath, '[]', 'utf8');
      }
      const raw = await fs.readFile(filePath, 'utf8');
      JSON.parse(raw);
      results.valid++;
      logger.info({ file: filename }, 'JSON file OK');
    } catch (err) {
      results.errors.push({ file: filename, error: err.message });
      logger.error({ file: filename, error: err.message }, 'JSON validation failed');
    }
  }

  return results;
}

module.exports = {
  validateAllJsonFiles,
  JSON_FILES
};
