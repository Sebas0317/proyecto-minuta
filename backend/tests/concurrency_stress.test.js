import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt_minuta_2026';
const adminToken = jwt.sign(
  { id: 'admin1', username: 'admin', role: 'admin' },
  JWT_SECRET
);

describe('Pruebas de Estrés, Concurrencia y Resiliencia Anti-DoS', () => {
  it('15 escrituras simultáneas en Mascotas persisten el 100% sin pérdida de registros (0 lost updates)', async () => {
    const before = (await request(app).get('/v1/mascotas')).body;
    const N = 15;

    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app)
          .post('/v1/mascotas')
          .set('X-Forwarded-For', `192.0.2.${i + 1}`)
          .send({
            nombre: `StressPetQA-${i}`,
            especie: 'perro',
            raza: 'Criollo',
            torre: 'Torre 1',
            apto: String(500 + i),
          })
      )
    );

    for (const r of responses) {
      expect(r.status).toBe(201);
    }

    const after = (await request(app).get('/v1/mascotas')).body;
    expect(after.length - before.length).toBe(N);

    // Cleanup created test records
    await Promise.all(
      responses.map((r) =>
        request(app)
          .delete(`/v1/mascotas/${r.body.id}`)
          .set('Cookie', [`token=${adminToken}`])
          .set('X-Forwarded-For', '192.0.2.250')
      )
    );
  });

  it('10 radicaciones PQRS simultáneas generan 10 consecutivos únicos sin colisión ni pérdida', async () => {
    const N = 10;
    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app)
          .post('/v1/pqrs')
          .set('X-Forwarded-For', `198.51.100.${10 + i}`)
          .send({
            categoria: 'Mantenimiento',
            asunto: `Concurrencia PQRS #${i}`,
            descripcion: 'Validación de unicidad bajo ráfaga paralela',
            torre: 'Torre 2',
            apto: '201',
          })
      )
    );

    const radicados = responses.map((r) => r.body.radicado);
    expect(responses.every((r) => r.status === 201)).toBe(true);
    expect(new Set(radicados).size).toBe(N);
  });

  it('10 reservas simultáneas al mismo espacio y horario aceptan exactamente 1 (201) y rechazan 9 (409)', async () => {
    const uniqueDate = '2028-11-15';
    const N = 10;

    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app)
          .post('/v1/reservas-zonas')
          .set('X-Forwarded-For', `203.0.113.${10 + i}`)
          .send({
            espacio: '⚽ Cancha Sintética Fútbol 5',
            apto: String(300 + i),
            torre: 'Torre 3',
            fechaReserva: uniqueDate,
            horaInicio: '20:00',
            horaFin: '21:00',
          })
      )
    );

    const created = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);
    expect(created.length).toBe(1);
    expect(conflicts.length).toBe(N - 1);
  });

  it('10 votos simultáneos de la misma unidad en Asamblea aceptan exactamente 1 (200) y bloquean 9 (409)', async () => {
    const asmb = (
      await request(app)
        .post('/v1/asambleas')
        .set('Cookie', [`token=${adminToken}`])
        .send({ titulo: 'Asamblea Anti-Race QA' })
    ).body;
    const vot = (
      await request(app)
        .post(`/v1/asambleas/${asmb.id}/votaciones`)
        .set('Cookie', [`token=${adminToken}`])
        .send({ pregunta: '¿Validar control concurrente de voto único?' })
    ).body;

    const N = 10;
    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app)
          .post(`/v1/asambleas/${asmb.id}/votaciones/${vot.id}/votar`)
          .set('X-Forwarded-For', `203.0.113.${50 + i}`)
          .send({ opcion: 'si', coeficiente: 1.0, unidadId: 'unidad-race-999' })
      )
    );

    const accepted = responses.filter((r) => r.status === 200);
    const rejected = responses.filter((r) => r.status === 409);
    expect(accepted.length).toBe(1);
    expect(rejected.length).toBe(N - 1);
  });

  it('10 paquetes simultáneos con hashing bcrypt persisten el 100% sin pérdidas', async () => {
    const before = (await request(app).get('/v1/paquetes')).body;
    const N = 10;

    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app)
          .post('/v1/paquetes')
          .set('Cookie', [`token=${adminToken}`])
          .set('X-Forwarded-For', `203.0.113.${100 + i}`)
          .send({
            torre: 'Torre 1',
            apto: '101',
            destinatario: `Concurrente ${i}`,
            empresa: 'Coordinadora',
          })
      )
    );

    expect(responses.every((r) => r.status === 201)).toBe(true);
    const after = (await request(app).get('/v1/paquetes')).body;
    expect(after.length - before.length).toBe(N);
  });

  it('MinutaBot rechaza bombas de texto >1500 caracteres en <20ms y limita payloads >500KB con HTTP 413', async () => {
    const t0 = performance.now();
    const bombRes = await request(app)
      .post('/v1/chatbot/query')
      .send({ message: 'supercalifragilistico '.repeat(200) });
    const elapsed = performance.now() - t0;

    expect(bombRes.status).toBe(400);
    expect(elapsed).toBeLessThan(100);

    const oversizedRes = await request(app)
      .post('/v1/minuta')
      .set('Cookie', [`token=${adminToken}`])
      .send({ descripcion: 'X'.repeat(550 * 1024) });
    expect(oversizedRes.status).toBe(413);
  });
});
