/**
 * Claves estandarizadas de caché para @tanstack/react-query en MinutaTech
 */
export const queryKeys = {
  unidades: (params = {}) => ['unidades', params],
  minuta: (params = {}) => ['minuta', params],
  paquetes: (params = {}) => ['paquetes', params],
  accesos: (params = {}) => ['accesos', params],
  parqueaderos: (params = {}) => ['parqueaderos', params],
  rondas: ['rondas'],
  contextoOperativo: ['contextoOperativo'],
  festivos: (year) => ['festivos', year],
  lastLogin: ['lastLogin'],
  loginLogs: ['loginLogs'],
  securityEvents: ['securityEvents'],
};

export const staleTimes = {
  operativo: 1000 * 20, // 20s para portería en vivo
  unidades: 1000 * 60 * 2, // 2 min para censo
  contexto: 1000 * 60 * 5, // 5 min para clima/pico y placa/festivos
};
