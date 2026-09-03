'use strict';

/**
 * Bridge module — re-exports persistence.js with saveXxx aliases
 * for residential complex (Minuta) and legacy hotel entities.
 */
const mod = require('./persistence');

module.exports = {
  // Residential / Minuta
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

  // General & Users
  getUsers: mod.getUsers,
  saveUsers: mod.setUsers,
  getHistory: mod.getHistory,
  saveHistory: mod.setHistory,
  getStateHistory: mod.getStateHistory,
  saveStateHistory: mod.setStateHistory,

  // Legacy fallback
  getRooms: mod.getRooms,
  saveRooms: mod.setRooms,
  getConsumos: mod.getConsumos,
  saveConsumos: mod.setConsumos,
  getPrices: mod.getPrices,
  savePrices: mod.setPrices,
  getReservas: mod.getReservas,
  saveReservas: mod.setReservas,
};
