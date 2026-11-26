'use strict';

const PERMISSIONS = {
  owner: ['*:*'],
  admin: [
    'unidades:*',
    'minuta:*',
    'paquetes:*',
    'accesos:*',
    'parqueaderos:*',
    'trasteos:*',
    'rondas:*',
    'reservas:*',
    'asambleas:*',
    'pqrs:*',
    'equipos:*',
    'mascotas:*',
    'chatbot:*',
    'rooms:*',
    'consumos:*',
    'users:*',
    'accounting:*',
    'reports:*',
    'auth:*',
    'backup:*',
    'config:*',
    'history:*',
  ],
  supervisor: [
    'unidades:read',
    'minuta:*',
    'paquetes:*',
    'accesos:*',
    'parqueaderos:*',
    'trasteos:*',
    'rondas:*',
    'reservas:*',
    'asambleas:read',
    'asambleas:vote',
    'pqrs:read',
    'pqrs:write',
    'equipos:read',
    'equipos:write',
    'mascotas:read',
    'mascotas:write',
    'rooms:read',
    'rooms:write',
    'rooms:checkin',
    'consumos:*',
    'users:read',
    'accounting:read',
    'reports:read',
    'history:read',
  ],
  guarda: [
    'unidades:read',
    'minuta:read',
    'minuta:write',
    'paquetes:read',
    'paquetes:write',
    'accesos:read',
    'accesos:write',
    'parqueaderos:read',
    'parqueaderos:write',
    'trasteos:read',
    'trasteos:write',
    'rondas:read',
    'rondas:write',
    'reservas:read',
    'equipos:read',
    'mascotas:read',
    'mascotas:write',
    'rooms:read',
    'rooms:write',
    'rooms:checkin',
    'consumos:*',
    'accounting:read',
    'reports:read',
    'history:read',
  ],
  operator: [
    'unidades:read',
    'minuta:read',
    'minuta:write',
    'paquetes:read',
    'paquetes:write',
    'accesos:read',
    'accesos:write',
    'parqueaderos:read',
    'parqueaderos:write',
    'rondas:read',
    'rondas:write',
    'rooms:read',
    'rooms:write',
    'rooms:checkin',
    'consumos:*',
    'accounting:read',
    'reports:read',
    'history:read',
    'reservas:read',
    'reservas:write',
  ],
  analyst: [
    'unidades:read',
    'minuta:read',
    'pqrs:read',
    'rooms:read',
    'consumos:read',
    'accounting:*',
    'reports:*',
    'history:read',
  ],
  cliente: [
    'reservas:read',
    'reservas:write',
    'trasteos:read',
    'trasteos:write',
    'pqrs:read',
    'pqrs:create',
    'mascotas:read',
    'mascotas:create',
    'accesos:preautorizar',
    'asambleas:vote',
    'rooms:read',
    'consumos:read',
  ],
  residente: [
    'reservas:read',
    'reservas:write',
    'trasteos:read',
    'trasteos:write',
    'pqrs:read',
    'pqrs:create',
    'mascotas:read',
    'mascotas:create',
    'accesos:preautorizar',
    'asambleas:vote',
  ],
};

const ROLE_HIERARCHY = {
  owner: 1000,
  admin: 100,
  supervisor: 80,
  guarda: 60,
  operator: 60,
  analyst: 40,
  residente: 10,
  cliente: 10,
};

function hasPermission(role, permission) {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;

  const permParts = permission.split(':');
  for (const rp of rolePerms) {
    const rpParts = rp.split(':');
    if (rpParts[0] === '*' && rpParts[1] === '*') return true;
    if (rpParts[0] === '*' || rpParts[0] === permParts[0]) {
      if (rpParts[1] === '*' || rpParts[1] === permParts[1]) {
        return true;
      }
    }
  }
  return false;
}

function roleAtLeast(role, minimum) {
  return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[minimum] || 0);
}

function getPermissions(role) {
  return PERMISSIONS[role] || [];
}

module.exports = {
  PERMISSIONS,
  ROLE_HIERARCHY,
  hasPermission,
  roleAtLeast,
  getPermissions,
};
