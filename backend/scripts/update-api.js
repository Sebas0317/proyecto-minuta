const fs = require('fs');
const apiPath = './frontend/src/services/api.js';
let content = fs.readFileSync(apiPath, 'utf8');

if (!content.includes('fetchUnidades')) {
  const residentialApi = `
// ══════════════════════════════════════════════════════════
// ── PROYECTO MINUTA: API DE PORTERÍA Y CONJUNTOS ──
// ══════════════════════════════════════════════════════════

// ── UNIDADES / APARTAMENTOS ──
export async function fetchUnidades(params = {}) {
  const qs = new URLSearchParams();
  if (params.torre) qs.append('torre', params.torre);
  if (params.estado) qs.append('estado', params.estado);
  if (params.search) qs.append('search', params.search);
  const query = qs.toString() ? \`?\${qs.toString()}\` : '';
  return apiFetch(\`/unidades\${query}\`, { method: 'GET' });
}

export async function fetchUnidad(id) {
  return apiFetch(\`/unidades/\${id}\`, { method: 'GET' });
}

export async function createUnidad(data) {
  return apiFetch('/unidades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUnidad(id, data) {
  return apiFetch(\`/unidades/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUnidad(id) {
  return apiFetch(\`/unidades/\${id}\`, {
    method: 'DELETE',
  });
}

// ── MINUTA DIGITAL ──
export async function fetchMinuta(params = {}) {
  const qs = new URLSearchParams();
  if (params.tipo) qs.append('tipo', params.tipo);
  if (params.severidad) qs.append('severidad', params.severidad);
  if (params.fecha) qs.append('fecha', params.fecha);
  if (params.search) qs.append('search', params.search);
  const query = qs.toString() ? \`?\${qs.toString()}\` : '';
  return apiFetch(\`/minuta\${query}\`, { method: 'GET' });
}

export async function fetchMinutaStats() {
  return apiFetch('/minuta/stats', { method: 'GET' });
}

export async function createMinutaEntry(data) {
  return apiFetch('/minuta', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── PAQUETERÍA ──
export async function fetchPaquetes(params = {}) {
  const qs = new URLSearchParams();
  if (params.estado) qs.append('estado', params.estado);
  if (params.torre) qs.append('torre', params.torre);
  if (params.apto) qs.append('apto', params.apto);
  if (params.search) qs.append('search', params.search);
  const query = qs.toString() ? \`?\${qs.toString()}\` : '';
  return apiFetch(\`/paquetes\${query}\`, { method: 'GET' });
}

export async function createPaquete(data) {
  return apiFetch('/paquetes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function notificarPaquete(id) {
  return apiFetch(\`/paquetes/\${id}/notificar\`, {
    method: 'PATCH',
  });
}

export async function entregarPaquete(id, data) {
  return apiFetch(\`/paquetes/\${id}/entregar\`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── CONTROL DE ACCESOS (VISITAS / DOMICILIOS) ──
export async function fetchAccesos(params = {}) {
  const qs = new URLSearchParams();
  if (params.estado) qs.append('estado', params.estado);
  if (params.tipo) qs.append('tipo', params.tipo);
  if (params.torre) qs.append('torre', params.torre);
  if (params.apto) qs.append('apto', params.apto);
  if (params.search) qs.append('search', params.search);
  const query = qs.toString() ? \`?\${qs.toString()}\` : '';
  return apiFetch(\`/accesos\${query}\`, { method: 'GET' });
}

export async function registrarIngreso(data) {
  return apiFetch('/accesos/ingreso', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registrarSalida(id) {
  return apiFetch(\`/accesos/\${id}/salida\`, {
    method: 'PATCH',
  });
}

// ── TRASTEOS Y MUDANZAS ──
export async function fetchTrasteos(params = {}) {
  const qs = new URLSearchParams();
  if (params.estado) qs.append('estado', params.estado);
  if (params.tipo) qs.append('tipo', params.tipo);
  if (params.torre) qs.append('torre', params.torre);
  if (params.apto) qs.append('apto', params.apto);
  const query = qs.toString() ? \`?\${qs.toString()}\` : '';
  return apiFetch(\`/trasteos\${query}\`, { method: 'GET' });
}

export async function createTrasteo(data) {
  return apiFetch('/trasteos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTrasteoEstado(id, data) {
  return apiFetch(\`/trasteos/\${id}/estado\`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── PARQUEADERO DE VISITANTES ──
export async function fetchParqueaderos() {
  return apiFetch('/parqueaderos', { method: 'GET' });
}

export async function ocuparParqueadero(id, data) {
  return apiFetch(\`/parqueaderos/\${id}/ocupar\`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function liberarParqueadero(id) {
  return apiFetch(\`/parqueaderos/\${id}/liberar\`, {
    method: 'PATCH',
  });
}
`;
  content += residentialApi;
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('frontend/src/services/api.js actualizado con funciones de Minuta y Portería');
} else {
  console.log('api.js ya contenía fetchUnidades');
}
