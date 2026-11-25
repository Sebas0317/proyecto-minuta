/**
 * Automated backup system using node-cron.
 * Backs up all JSON data files daily at 2:00 AM.
 * Keeps last 30 days of backups.
 */
'use strict';

const cron = require('node-cron');
const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const { logger } = require('./logger');

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

// Simple in-process mutex to serialize backup runs
let backupLock = Promise.resolve();
function queueBackup(fn) {
  backupLock = backupLock.then(() => fn()).catch(() => fn());
  return backupLock;
}

const BACKUP_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), 'ecobosque-backups')
  : path.join(__dirname, '../../backups');
const DATA_DIR = path.join(__dirname, '../..');
const DATA_FILES = [
  'unidades.json',
  'minuta.json',
  'paquetes.json',
  'accesos.json',
  'parqueaderos.json',
  'trasteos.json',
  'users.json',
  'chatbot_knowledge.json',
  'codes.json',
  'history.json',
  'stateHistory.json',
];
const MAX_BACKUP_DAYS = 30;

async function _createBackup() {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const backupDir = path.join(BACKUP_DIR, timestamp);

    await fs.mkdir(backupDir, { recursive: true });

    const results = await Promise.all(
      DATA_FILES.map(async (file) => {
        const src = path.join(DATA_DIR, file);
        const dest = path.join(backupDir, file);
        try {
          await fs.copyFile(src, dest);
          return { file, status: 'success' };
        } catch (err) {
          return { file, status: 'error', error: err.message };
        }
      })
    );

    logger.info({ timestamp }, 'Backup created');
    return { timestamp, results };
  } catch (error) {
    logger.error({ err: error }, 'Backup creation failed');
    throw error;
  }
}

async function cleanupOldBackups() {
  try {
    const backups = await fs.readdir(BACKUP_DIR);
    const backupDirs = backups.filter((b) => /^\d{4}-\d{2}-\d{2}T/.test(b));

    if (backupDirs.length <= MAX_BACKUP_DAYS) {
      return;
    }

    const sorted = backupDirs.sort();
    const toRemove = sorted.slice(0, sorted.length - MAX_BACKUP_DAYS);

    for (const dir of toRemove) {
      const backupPath = path.join(BACKUP_DIR, dir);
      await fs.rm(backupPath, { recursive: true, force: true });
      logger.info({ dir }, 'Removed old backup');
    }
  } catch (error) {
    logger.error({ err: error }, 'Backup cleanup failed');
  }
}

async function listBackups() {
  try {
    const backups = await fs.readdir(BACKUP_DIR);
    return backups.sort().reverse();
  } catch {
    return [];
  }
}

async function restoreBackup(timestamp) {
  try {
    const backupDir = path.join(BACKUP_DIR, timestamp);
    await fs.access(backupDir);

    const results = [];
    for (const file of DATA_FILES) {
      const src = path.join(backupDir, file);
      const dest = path.join(DATA_DIR, file);

      try {
        await fs.copyFile(src, dest);
        results.push({ file, status: 'restored' });
      } catch (err) {
        results.push({ file, status: 'error', error: err.message });
      }
    }

    logger.info({ timestamp }, 'Backup restored');
    return { timestamp, results };
  } catch (error) {
    logger.error({ err: error }, 'Backup restore failed');
    throw error;
  }
}

function createBackup() {
  return queueBackup(_createBackup);
}

// Schedule daily backup at 2:00 AM (local persistent server only)
if (process.env.NODE_ENV !== 'test' && !IS_VERCEL) {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting scheduled backup');
    try {
      await createBackup();
      await cleanupOldBackups();
      logger.info('Scheduled backup completed');
    } catch (error) {
      logger.error({ err: error }, 'Scheduled backup failed');
    }
  });
}

module.exports = {
  createBackup,
  cleanupOldBackups,
  listBackups,
  restoreBackup,
};
