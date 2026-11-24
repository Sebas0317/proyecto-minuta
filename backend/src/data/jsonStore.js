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
  getAsambleas: mod.getAsambleas,
  saveAsambleas: mod.setAsambleas,
  getPqrs: mod.getPqrs,
  savePqrs: mod.setPqrs,
  getRondas: mod.getRondas,
  saveRondas: mod.setRondas,
  getReservasZonas: mod.getReservasZonas,
  saveReservasZonas: mod.setReservasZonas,
  getEquipos: mod.getEquipos,
  saveEquipos: mod.setEquipos,
  getMascotas: mod.getMascotas,
  saveMascotas: mod.setMascotas,
  getChatbotKnowledge: mod.getChatbotKnowledge,
  saveChatbotKnowledge: mod.setChatbotKnowledge,
  getUnansweredQuestions: mod.getUnansweredQuestions,
  saveUnansweredQuestions: mod.setUnansweredQuestions,
  getConsultasAnalytics: mod.getConsultasAnalytics,
  saveConsultasAnalytics: mod.setConsultasAnalytics,

  // General & Usuarios
  getUsers: mod.getUsers,
  saveUsers: mod.setUsers,
  getHistory: mod.getHistory,
  saveHistory: mod.setHistory,
  getStateHistory: mod.getStateHistory,
  saveStateHistory: mod.setStateHistory,
};
