const fs = require('fs');
const persistencePath = './backend/src/data/persistence.js';
let content = fs.readFileSync(persistencePath, 'utf8');

if (!content.includes('UNIDADES_KEY')) {
  content = content.replace(
    "const ROOMS_KEY = 'data:rooms';",
    "const UNIDADES_KEY = 'data:unidades';\nconst MINUTA_KEY = 'data:minuta';\nconst PAQUETES_KEY = 'data:paquetes';\nconst ACCESOS_KEY = 'data:accesos';\nconst TRASTEOS_KEY = 'data:trasteos';\nconst PARQUEADEROS_KEY = 'data:parqueaderos';\nconst ROOMS_KEY = 'data:rooms';"
  );
  
  content = content.replace(
    "[ROOMS_KEY]: 'rooms.json',",
    "[UNIDADES_KEY]: 'unidades.json',\n    [MINUTA_KEY]: 'minuta.json',\n    [PAQUETES_KEY]: 'paquetes.json',\n    [ACCESOS_KEY]: 'accesos.json',\n    [TRASTEOS_KEY]: 'trasteos.json',\n    [PARQUEADEROS_KEY]: 'parqueaderos.json',\n    [ROOMS_KEY]: 'rooms.json',"
  );

  const newMethods = `
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
`;

  content = content.replace('// ── Key-specific helpers ──', '// ── Key-specific helpers ──\n' + newMethods);

  content = content.replace(
    'module.exports = {',
    'module.exports = {\n  getUnidades,\n  setUnidades,\n  getMinuta,\n  setMinuta,\n  getPaquetes,\n  setPaquetes,\n  getAccesos,\n  setAccesos,\n  getTrasteos,\n  setTrasteos,\n  getParqueaderos,\n  setParqueaderos,'
  );

  fs.writeFileSync(persistencePath, content, 'utf8');
  console.log('persistence.js actualizado exitosamente');
} else {
  console.log('persistence.js ya estaba actualizado');
}
