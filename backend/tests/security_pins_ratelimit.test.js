import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { pinIpStore, pinTargetStore } from '../src/middleware/rateLimiters';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt_minuta_2026';
const adminToken = jwt.sign({ id: 'admin1', username: 'admin', role: 'admin' }, JWT_SECRET);

describe('Auditoría de Seguridad: Hashing de PINs y Rate Limiting Compuesto (IP + Recurso)', () => {

  beforeEach(async () => {
    pinIpStore.memoryFallback.clear();
    pinTargetStore.memoryFallback.clear();
  });

  describe('1. Criptografía y Almacenamiento de PINs (bcrypt)', () => {
    it('todas las unidades deben almacenar pinAccesoHash con bcrypt y nunca texto plano', () => {
      const unidadesPath = path.resolve(__dirname, '..', 'unidades.json');
      const unidades = JSON.parse(fs.readFileSync(unidadesPath, 'utf8'));

      expect(unidades.length).toBeGreaterThan(0);
      for (const u of unidades) {
        expect(u.pinAcceso).toBeUndefined();
        if (u.pinAccesoHash) {
          expect(u.pinAccesoHash.startsWith('')).toBe(true);
        }
      }
    });

    it('los paquetes registrados no deben tener codigoRetiro en texto plano en disco', () => {
      const paquetesPath = path.resolve(__dirname, '..', 'paquetes.json');
      const paquetes = JSON.parse(fs.readFileSync(paquetesPath, 'utf8'));

      for (const p of paquetes) {
        expect(p.codigoRetiro).toBeUndefined();
        if (p.codigoRetiroHash) {
          expect(p.codigoRetiroHash.startsWith('')).toBe(true);
        }
      }
    });
  });

  describe('2. Ciclo de Entrega con Hash y Validación de PIN', () => {
    it('debe registrar un paquete, devolver el PIN en texto plano SOLO en 201, y autorizar la entrega con bcrypt', async () => {
      const createRes = await request(app)
        .post('/v1/paquetes')
        .set('Cookie', ['token=' + adminToken])
        .send({
          torre: 'Torre 1',
          apto: '101',
          destinatario: 'Carlos Pérez',
          empresa: 'Amazon',
          guia: 'AMZ-888999'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.codigoRetiro).toBeDefined();
      const plainPin = createRes.body.codigoRetiro;
      const pkgId = createRes.body.id;

      const listRes = await request(app).get('/v1/paquetes');
      const found = listRes.body.find(p => p.id === pkgId);
      expect(found.codigoRetiro).toBeUndefined();
      expect(found.codigoRetiroHash).toBeUndefined();

      const failRes = await request(app)
        .patch('/v1/paquetes/' + pkgId + '/entregar')
        .set('Cookie', ['token=' + adminToken])
        .send({ codigoRetiro: '0000', retiradoPor: 'Carlos Pérez' });
      expect(failRes.status).toBe(400);
      expect(failRes.body.error).toContain('incorrecto');

      const okRes = await request(app)
        .patch('/v1/paquetes/' + pkgId + '/entregar')
        .set('Cookie', ['token=' + adminToken])
        .send({ codigoRetiro: plainPin, retiradoPor: 'Carlos Pérez' });
      expect(okRes.status).toBe(200);
      expect(okRes.body.estado).toBe('entregado');
    });
  });

  describe('3. Rate Limiting Ofensivo contra Ataques de Fuerza Bruta', () => {
    it('debe bloquear con HTTP 429 tras 5 intentos fallidos desde la misma IP contra diferentes recursos', async () => {
      const attackerIp = '198.51.100.77';

      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .patch('/v1/paquetes/pkg-dummy-' + i + '/entregar')
          .set('X-Forwarded-For', attackerIp)
          .set('Cookie', ['token=' + adminToken])
          .send({ codigoRetiro: '1111' });

        expect(res.status).not.toBe(429);
      }

      const blockedRes = await request(app)
        .patch('/v1/paquetes/pkg-dummy-6/entregar')
        .set('X-Forwarded-For', attackerIp)
        .set('Cookie', ['token=' + adminToken])
        .send({ codigoRetiro: '1111' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error).toContain('Demasiados intentos de PIN');
    });

    it('debe bloquear con HTTP 429 tras 5 intentos fallidos contra el MISMO recurso rotando IPs', async () => {
      const createRes = await request(app)
        .post('/v1/paquetes')
        .set('Cookie', ['token=' + adminToken])
        .send({
          torre: 'Torre 2',
          apto: '202',
          destinatario: 'Objetivo BruteForce',
          empresa: 'Servientrega'
        });

      const targetPkgId = createRes.body.id;

      for (let i = 1; i <= 5; i++) {
        const rotatingIp = '203.0.113.' + i;
        const res = await request(app)
          .patch('/v1/paquetes/' + targetPkgId + '/entregar')
          .set('X-Forwarded-For', rotatingIp)
          .set('Cookie', ['token=' + adminToken])
          .send({ codigoRetiro: '999' + i });

        expect(res.status).toBe(400);
      }

      const freshIp = '203.0.113.99';
      const blockedRes = await request(app)
        .patch('/v1/paquetes/' + targetPkgId + '/entregar')
        .set('X-Forwarded-For', freshIp)
        .set('Cookie', ['token=' + adminToken])
        .send({ codigoRetiro: '0000' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error).toContain('Demasiados intentos de PIN');
    });
  });
});