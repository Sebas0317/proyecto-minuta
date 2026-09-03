const fs = require('fs');
const path = require('path');

// 1. Files to delete
const filesToDelete = [
  'backend/rooms.json',
  'backend/consumos.json',
  'backend/prices.json',
  'backend/reservas.json',
  'backend/src/routes/rooms.js',
  'backend/src/routes/consumos.js',
  'backend/src/routes/prices.js',
  'backend/src/routes/reservas.js',
  'backend/src/routes/accounting.js',
  'backend/src/controllers/roomsController.js',
  'backend/src/controllers/consumosController.js',
  'backend/src/controllers/pricesController.js',
  'backend/src/controllers/reservasController.js',
  'backend/src/controllers/accountingController.js',
  'frontend/src/components/HotelTitle.jsx',
  'frontend/src/components/UserView.jsx',
  'frontend/src/components/UserCheckout.jsx',
  'frontend/src/components/UserMenu.jsx',
  'frontend/src/test/HotelTitle.test.jsx'
];

const root = 'c:/Users/kevin/Desktop/PROYECTOS/minuta';

filesToDelete.forEach(f => {
  const full = path.join(root, f);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log('Deleted:', f);
  }
});

// 2. Clean server.js
const serverPath = path.join(root, 'backend/server.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Remove legacy imports
serverCode = serverCode.replace(/const roomsRoutes = require\('\.\/src\/routes\/rooms'\);\r?\n?/, '');
serverCode = serverCode.replace(/const consumosRoutes = require\('\.\/src\/routes\/consumos'\);\r?\n?/, '');
serverCode = serverCode.replace(/const pricesRoutes = require\('\.\/src\/routes\/prices'\);\r?\n?/, '');
serverCode = serverCode.replace(/const accountingRoutes = require\('\.\/src\/routes\/accounting'\);\r?\n?/, '');
serverCode = serverCode.replace(/const reservasRoutes = require\('\.\/src\/routes\/reservas'\);\r?\n?/, '');

// Remove legacy route mounts
serverCode = serverCode.replace(/\/\/ Rooms routes[\s\S]*?app\.use\('\/accounting', accountingRoutes\);\r?\n?/, '');
serverCode = serverCode.replace(/app\.use\('\/v1\/reservas', requireAuth, reservasRoutes\);\r?\n?/, '');
serverCode = serverCode.replace(/app\.use\('\/reservas', requireAuth, reservasRoutes\);\r?\n?/, '');

fs.writeFileSync(serverPath, serverCode);
console.log('✓ server.js cleaned');

// 3. Clean jsonValidator.js
const validatorPath = path.join(root, 'backend/src/utils/jsonValidator.js');
const validatorCode = `'use strict';

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
`;
fs.writeFileSync(validatorPath, validatorCode);
console.log('✓ jsonValidator.js cleaned');

// 4. Clean backup.js
const backupPath = path.join(root, 'backend/src/utils/backup.js');
let backupCode = fs.readFileSync(backupPath, 'utf8');
backupCode = backupCode.replace(/const DATA_FILES = \[[\s\S]*?\];/, `const DATA_FILES = [
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
  'stateHistory.json'
];`);
fs.writeFileSync(backupPath, backupCode);
console.log('✓ backup.js cleaned');

// 5. Clean jsonStore.js
const jsonStorePath = path.join(root, 'backend/src/data/jsonStore.js');
const jsonStoreCode = `'use strict';

const mod = require('./persistence');

module.exports = {
  // Residencial / Minuta
  getUnidades: mod.getUnidades,
  saveUnidades: mod.setUnidades,
  getMinuta: mod.getMinuta,
  saveMinuta: mod.setMinuta,
  getPaquetes: mod.getPaquetes,
  savePaquetes: mod.setPaquetes,
  getAccesos: mod.getAccesos,
  saveAccesos: mod.setAccesos,
  getTrasteos: mod.getTrasteos,
  saveTrasteos: mod.setTrasteos,
  getParqueaderos: mod.getParqueaderos,
  saveParqueaderos: mod.setParqueaderos,

  // General & Usuarios
  getUsers: mod.getUsers,
  saveUsers: mod.setUsers,
  getHistory: mod.getHistory,
  saveHistory: mod.setHistory,
  getStateHistory: mod.getStateHistory,
  saveStateHistory: mod.setStateHistory,
};
`;
fs.writeFileSync(jsonStorePath, jsonStoreCode);
console.log('✓ jsonStore.js cleaned');

// 6. Clean App.jsx
const appPath = path.join(root, 'frontend/src/App.jsx');
let appCode = fs.readFileSync(appPath, 'utf8');
appCode = appCode.replace(/const UserView = lazy\(\(\) => import\('\.\/components\/UserView'\)\);\r?\n?/, '');
appCode = appCode.replace(/\/\/ Vistas secundarias\r?\n?/, '');
fs.writeFileSync(appPath, appCode);
console.log('✓ App.jsx cleaned');

console.log('✓ ALL LEGACY CLEANUP COMPLETE');