'use strict';

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
  getPqrs: mod.getPqrs,
  savePqrs: mod.setPqrs,

  // General & Usuarios
  getUsers: mod.getUsers,
  saveUsers: mod.setUsers,
  getHistory: mod.getHistory,
  saveHistory: mod.setHistory,
  getStateHistory: mod.getStateHistory,
  saveStateHistory: mod.setStateHistory,
};
