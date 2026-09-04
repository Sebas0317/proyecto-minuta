/**
 * Security & Integrity Regression Test Suite
 * Tests covering Findings 1, 2, 3, 4, 5 of Senior Code Review
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../src/utils/secretLoader.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minuta-super-seguro-256bit';

let app;
let authCookie;

beforeAll(async () => {
  const serverModule = await import('../server.js');
  app = serverModule.app;
  const token = jwt.sign(
    { id: 'admin-test-id', role: 'admin', username: 'admin' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  authCookie = `token=${token}`;
}, 30000);

describe('1. 🔴 FUGA DE PII EN GET /v1/unidades', () => {
  it('Petición pública sin auth NUNCA debe exponer documento, teléfono, email ni pinAcceso', async () => {
    const res = await request(app).get('/v1/unidades');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Validar exhaustivamente en TODOS los inmuebles del array
    for (const u of res.body) {
      // 1. pinAcceso
      expect(u.pinAcceso).toBeUndefined();

      // 2. propietario sensible
      if (u.propietario) {
        expect(u.propietario.documento).toBeUndefined();
        expect(u.propietario.telefono).toBeUndefined();
        expect(u.propietario.email).toBeUndefined();
      }

      // 3. residentes sensibles
      if (Array.isArray(u.residentes)) {
        for (const r of u.residentes) {
          expect(r.documento).toBeUndefined();
          expect(r.telefono).toBeUndefined();
          expect(r.email).toBeUndefined();
          expect(r.pin).toBeUndefined();
        }
      }

      // 4. contrato de arriendo sensible
      if (u.contratoArriendo) {
        expect(u.contratoArriendo.inquilinoDoc).toBeUndefined();
        expect(u.contratoArriendo.inquilinoTel).toBeUndefined();
      }
    }
  });

  it('Petición autenticada como admin sí puede recibir información administrativa de contacto', async () => {
    const res = await request(app).get('/v1/unidades').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Pero el pinAcceso en listados generales permanece protegido
    for (const u of res.body) {
      expect(u.pinAcceso).toBeUndefined();
    }
  });
});

describe('2. 🔴 BYPASS DE PIN EN ENTREGA DE PAQUETES', () => {
  let paqueteTestId;
  const PIN_CORRECTO = '7890';

  beforeAll(async () => {
    // Crear un paquete de prueba
    const res = await request(app)
      .post('/v1/paquetes')
      .set('Cookie', authCookie)
      .send({
        torre: 'Torre 1',
        apto: '101',
        destinatario: 'Usuario Test Seguridad',
        empresa: 'Servientrega',
        guia: 'SEC-TEST-99'
      });
    paqueteTestId = res.body.id;
    // Sobreescribir código de retiro conocido para la prueba
    res.body.codigoRetiro = PIN_CORRECTO;
  });

  it('PATCH /v1/paquetes/:id/entregar SIN codigoRetiro debe ser RECHAZADO con 400', async () => {
    const res = await request(app)
      .patch(`/v1/paquetes/${paqueteTestId}/entregar`)
      .set('Cookie', authCookie)
      .send({
        retiradoPor: 'Intruso Sin PIN'
        // codigoRetiro omitido a propósito
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('PIN');
  });

  it('PATCH /v1/paquetes/:id/entregar con codigoRetiro INCORRECTO debe ser RECHAZADO con 400', async () => {
    const res = await request(app)
      .patch(`/v1/paquetes/${paqueteTestId}/entregar`)
      .set('Cookie', authCookie)
      .send({
        retiradoPor: 'Intruso PIN Incorrecto',
        codigoRetiro: '0000'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('incorrecto');
  });
});

describe('3. 🔴 EXPOSICIÓN DE PIN EN getPaquetesByApto', () => {
  it('GET /v1/paquetes/unidad/:apto NO debe devolver codigoRetiro en consultas públicas', async () => {
    const res = await request(app).get('/v1/paquetes/unidad/101');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    for (const p of res.body) {
      expect(p.codigoRetiro).toBeUndefined();
    }
  });
});

describe('4. 🔴 SERVERLESS PERSISTENCE & 5. 🟡 ANTI-VOTE STUFFING EN ASAMBLEAS', () => {
  let asambleaId;
  let votacionId;

  it('Crea una asamblea y una votación mediante persistence.js', async () => {
    const resAsmb = await request(app)
      .post('/v1/asambleas')
      .set('Cookie', authCookie)
      .send({
        titulo: 'Asamblea Extraordinaria de Prueba'
      });
    expect(resAsmb.statusCode).toBe(201);
    asambleaId = resAsmb.body.id;

    const resVot = await request(app)
      .post(`/v1/asambleas/${asambleaId}/votaciones`)
      .set('Cookie', authCookie)
      .send({
        pregunta: '¿Aprueba el presupuesto de seguridad?'
      });
    expect(resVot.statusCode).toBe(201);
    votacionId = resVot.body.id;
  });

  it('Primer voto desde Apto 101 debe ser ACEPTADO', async () => {
    const res = await request(app)
      .post(`/v1/asambleas/${asambleaId}/votaciones/${votacionId}/votar`)
      .send({
        opcion: 'si',
        coeficiente: 1.25,
        unidadId: 't1-101'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('satisfactoriamente');
    expect(res.body.votacion.votosSi).toBe(1.25);
  });

  it('Segundo voto desde la MISMA unidad Apto 101 debe ser RECHAZADO con 409 Conflict', async () => {
    const res = await request(app)
      .post(`/v1/asambleas/${asambleaId}/votaciones/${votacionId}/votar`)
      .send({
        opcion: 'si',
        coeficiente: 1.25,
        unidadId: 't1-101' // Mismo votante intentando fraude
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain('ya emitió su voto');
  });

  it('Voto desde un Apto diferente (Apto 102) debe ser ACEPTADO', async () => {
    const res = await request(app)
      .post(`/v1/asambleas/${asambleaId}/votaciones/${votacionId}/votar`)
      .send({
        opcion: 'no',
        coeficiente: 1.25,
        unidadId: 't1-102'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.votacion.votosNo).toBe(1.25);
  });
});
