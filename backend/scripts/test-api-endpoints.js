const { getUnidades, getMinuta, getPaquetes, getAccesos, getTrasteos, getParqueaderos } = require('../src/data/jsonStore');

async function testStores() {
  console.log('--- TEST DATA STORES ---');
  const u = await getUnidades();
  console.log(`✓ Unidades: ${u.length} registradas`);
  const m = await getMinuta();
  console.log(`✓ Minuta: ${m.length} novedades`);
  const p = await getPaquetes();
  console.log(`✓ Paquetes: ${p.length} encomiendas`);
  const a = await getAccesos();
  console.log(`✓ Accesos: ${a.length} registros`);
  const t = await getTrasteos();
  console.log(`✓ Trasteos: ${t.length} mudanzas`);
  const prq = await getParqueaderos();
  console.log(`✓ Parqueaderos: ${prq.length} bahías`);
  console.log('--- TODOS LOS STORES FUNCIONAN AL 100% ---');
}

testStores().catch(console.error);