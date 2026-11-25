import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt_minuta_2026';
const adminToken = jwt.sign(
  { id: 'admin1', username: 'admin', role: 'admin' },
  JWT_SECRET
);
const supervisorToken = jwt.sign(
  { id: 'sup1', username: 'supervisor1', role: 'supervisor' },
  JWT_SECRET
);

describe('Regresión de correcciones integrales MinutaTech', () => {
  it('GET /v1/minuta?search=... no falla cuando hay registros sin titulo o con guardaTurno', async () => {
    const res = await request(app).get('/v1/minuta?search=novedad');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const item of res.body) {
      expect(typeof item.titulo).toBe('string');
      expect(typeof item.guarda).toBe('string');
    }
  });

  it('POST /v1/paquetes preserva metadatos de recibo_publico y genera PIN de 4 dígitos', async () => {
    const res = await request(app)
      .post('/v1/paquetes')
      .set('Cookie', ['token=' + adminToken])
      .send({
        torre: 'Torre 1',
        apto: '101',
        destinatario: 'Propietario 101',
        empresa: 'Enel Codensa',
        categoria: 'recibo_publico',
        tipoRecibo: 'Energía Eléctrica',
        mesFacturado: 'Noviembre 2026',
        valorFactura: '145000',
        observacion: 'Factura física en portería',
      });

    expect(res.status).toBe(201);
    expect(res.body.categoria).toBe('recibo_publico');
    expect(res.body.tipoRecibo).toBe('Energía Eléctrica');
    expect(res.body.mesFacturado).toBe('Noviembre 2026');
    expect(String(res.body.codigoRetiro)).toMatch(/^\d{4}$/);
  });

  it('GET /v1/unidades expone contacto para rol supervisor y oculta PIN', async () => {
    const res = await request(app)
      .get('/v1/unidades')
      .set('Cookie', ['token=' + supervisorToken]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].pinAcceso).toBeUndefined();
    expect(res.body[0].pinAccesoHash).toBeUndefined();
  });

  it('Mascotas: soporta propietarioNombre/telefonoContacto, filtro ?apto= y 404 al borrar inexistente', async () => {
    const createRes = await request(app)
      .post('/v1/mascotas')
      .send({
        nombre: 'TobyTest',
        especie: 'Perro',
        raza: 'Criollo',
        torre: 'Torre 2',
        apto: '405',
        propietarioNombre: 'Ana Prueba',
        telefonoContacto: '3001112233',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.propietario).toBe('Ana Prueba');
    expect(createRes.body.telefono).toBe('3001112233');

    const filterRes = await request(app).get('/v1/mascotas?apto=405');
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.some((m) => m.id === createRes.body.id)).toBe(true);

    const delRes = await request(app).delete(`/v1/mascotas/${createRes.body.id}`);
    expect(delRes.status).toBe(200);

    const notFoundDel = await request(app).delete('/v1/mascotas/id-inexistente-999');
    expect(notFoundDel.status).toBe(404);
  });

  it('Equipos de emergencia: crea, lista, elimina y devuelve 404 si no existe', async () => {
    const createRes = await request(app)
      .post('/v1/equipos')
      .send({
        nombre: 'Extintor Prueba QA',
        tipo: 'Extintor',
        ubicacion: 'Torre 1 Piso 2',
        estado: 'operativo',
      });
    expect(createRes.status).toBe(201);

    const delRes = await request(app).delete(`/v1/equipos/${createRes.body.id}`);
    expect(delRes.status).toBe(200);

    const delMissing = await request(app).delete('/v1/equipos/eq-inexistente-999');
    expect(delMissing.status).toBe(404);
  });

  it('Rondas: registrar un escaneo no duplica el registro en registrosRondas ni historialRondas', async () => {
    const beforeRes = await request(app).get('/v1/rondas');
    expect(beforeRes.status).toBe(200);
    const punto = beforeRes.body.puntosControl[0];
    expect(punto).toBeDefined();
    const initialCount = beforeRes.body.registrosRondas.length;

    const regRes = await request(app)
      .post('/v1/rondas/registrar')
      .send({
        puntoId: punto.id,
        guarda: 'Guarda QA',
        estado: 'normal',
        observaciones: 'Verificación de prueba',
      });
    expect(regRes.status).toBe(201);

    const afterRes = await request(app).get('/v1/rondas');
    expect(afterRes.status).toBe(200);
    expect(afterRes.body.registrosRondas.length).toBe(initialCount + 1);
    expect(afterRes.body.historialRondas.length).toBe(initialCount + 1);
  });

  it('Reservas de zonas: rechaza horaFin <= horaInicio con HTTP 400', async () => {
    const res = await request(app)
      .post('/v1/reservas-zonas')
      .send({
        espacio: 'Salón Social',
        apto: '101',
        torre: 'Torre 1',
        fechaReserva: '2026-12-20',
        horaInicio: '16:00',
        horaFin: '14:00',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('posterior');
  });

  it('Asambleas: cerrar votación calcula resultado APROBADA / RECHAZADA / EMPATE', async () => {
    const asmbRes = await request(app)
      .post('/v1/asambleas')
      .send({ titulo: 'Asamblea QA Regresión' });
    expect(asmbRes.status).toBe(201);
    const asmbId = asmbRes.body.id;

    const votRes = await request(app)
      .post(`/v1/asambleas/${asmbId}/votaciones`)
      .send({ pregunta: '¿Aprobar mantenimiento de ascensores?' });
    expect(votRes.status).toBe(201);
    const votId = votRes.body.id;

    const castRes = await request(app)
      .post(`/v1/asambleas/${asmbId}/votaciones/${votId}/votar`)
      .send({ opcion: 'si', coeficiente: 1.5, apto: '101' });
    expect(castRes.status).toBe(200);

    const closeRes = await request(app).patch(
      `/v1/asambleas/${asmbId}/votaciones/${votId}/cerrar`
    );
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.estado).toBe('cerrada');
    expect(closeRes.body.resultado).toBe('APROBADA');
    expect(closeRes.body.votacion.resultado).toBe('APROBADA');
  });

  it('Chatbot: consulta parqueaderos visitantes, reserva zona común y devuelve analytics estructurados', async () => {
    const parkRes = await request(app)
      .post('/v1/chatbot/query')
      .send({ message: 'cuantos parqueaderos libres hay' });
    expect(parkRes.status).toBe(200);
    expect(typeof parkRes.body.answer).toBe('string');
    expect(parkRes.body.answer.length).toBeGreaterThan(10);

    const reservaRes = await request(app)
      .post('/v1/chatbot/query')
      .send({ message: 'quiero reservar la cancha sintetica para el apto 305' });
    expect(reservaRes.status).toBe(200);
    expect(typeof reservaRes.body.answer).toBe('string');

    const analyticsRes = await request(app).get('/v1/chatbot/analytics');
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.categoriasMasConsultadas).toBeDefined();
    expect(typeof analyticsRes.body.consultasConRespuesta).toBe('number');
  });

  it('GET /v1/health/detailed e integridad JSON responden HTTP 200 sin error 500', async () => {
    const basicRes = await request(app).get('/v1/health');
    expect(basicRes.status).toBe(200);
    expect(typeof basicRes.body.redisAvailable).toBe('boolean');

    const detailedRes = await request(app).get('/v1/health/detailed');
    expect(detailedRes.status).toBe(200);
    expect(detailedRes.body.status).toBe('healthy');
    expect(detailedRes.body.dataFiles['unidades.json']?.valid).toBe(true);

    const integrityRes = await request(app).post('/v1/health/json-integrity');
    expect(integrityRes.status).toBe(200);
    expect(integrityRes.body.report.overall).toBe(true);
  });

  it('API /v1/integraciones/contexto-operativo y /festivos entregan clima Bogotá, Pico y Placa y 18 festivos Ley Emiliani', async () => {
    const ctxRes = await request(app).get('/v1/integraciones/contexto-operativo');
    expect(ctxRes.status).toBe(200);
    expect(ctxRes.body.clima?.ciudad).toContain('Bogotá');
    expect(ctxRes.body.picoYPlaca).toBeDefined();
    expect(typeof ctxRes.body.calendario?.mudanzasHabilitadasHoy).toBe('boolean');

    const festRes = await request(app).get('/v1/integraciones/festivos?year=2026');
    expect(festRes.status).toBe(200);
    expect(festRes.body.total).toBe(18);
    expect(festRes.body.festivos.some((f) => f.date === '2026-01-01')).toBe(true);
  });

  it('Paginación en servidor (?page=1&limit=5) funciona en Minuta, Accesos y Paquetería sin romper modo arreglo', async () => {
    const minPag = await request(app).get('/v1/minuta?page=1&limit=5');
    expect(minPag.status).toBe(200);
    expect(Array.isArray(minPag.body.data)).toBe(true);
    expect(minPag.body.data.length).toBeLessThanOrEqual(5);
    expect(minPag.body.pagination.page).toBe(1);
    expect(minPag.body.pagination.total).toBeGreaterThanOrEqual(minPag.body.data.length);

    const accPag = await request(app).get('/v1/accesos?page=1&limit=5');
    expect(accPag.status).toBe(200);
    expect(Array.isArray(accPag.body.data)).toBe(true);

    const pkgPag = await request(app).get('/v1/paquetes?page=1&limit=5');
    expect(pkgPag.status).toBe(200);
    expect(Array.isArray(pkgPag.body.data)).toBe(true);
  });

  it('RBAC granular bloquea con HTTP 403 acciones administrativas para rol guarda y cliente', async () => {
    const guardaToken = jwt.sign(
      { id: 'g1', username: 'guarda1', role: 'guarda' },
      JWT_SECRET
    );
    const clienteToken = jwt.sign(
      { id: 'c1', username: 'residente1', role: 'cliente' },
      JWT_SECRET
    );

    // Guarda NO puede eliminar unidades ni crear asambleas ni modificar base del chatbot
    const delUnitGuarda = await request(app)
      .delete('/v1/unidades/t1-101')
      .set('Cookie', [`token=${guardaToken}`]);
    expect(delUnitGuarda.status).toBe(403);

    const createAsmbGuarda = await request(app)
      .post('/v1/asambleas')
      .set('Cookie', [`token=${guardaToken}`])
      .send({ titulo: 'Intento No Autorizado' });
    expect(createAsmbGuarda.status).toBe(403);

    // Cliente NO puede registrar paquetes en portería
    const pkgCliente = await request(app)
      .post('/v1/paquetes')
      .set('Cookie', [`token=${clienteToken}`])
      .send({ torre: 'Torre 1', apto: '101', destinatario: 'Test' });
    expect(pkgCliente.status).toBe(403);
  });
});
