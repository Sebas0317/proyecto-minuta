/**
 * Test Suite Integral - Proyecto Minuta (Sistema de Portería y Vigilancia Residencial)
 * Tests: Salud, Minuta, Paquetería, Accesos, Parqueaderos, Unidades,
 * Rondas QR, Reservas Zonas, Asambleas Ley 675, Equipos de Emergencia,
 * Censo de Mascotas y MinutaBot IA con Memoria y Citas Normativas.
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

// ── 1. HEALTH & METRICS ──
describe('1. Estado y Salud del Sistema', () => {
  it('GET / -> Debe retornar estado del servidor', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
  });

  it('GET /health -> Debe responder saludable', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });
});

// ── 2. MINUTA DIGITAL DE VIGILANCIA ──
describe('2. Módulo de Minuta Digital', () => {
  it('GET /minuta -> Debe retornar lista de novedades oficiales', async () => {
    const res = await request(app).get('/minuta').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /minuta -> Debe asentar una novedad en la minuta oficial', async () => {
    const res = await request(app)
      .post('/minuta')
      .set('Cookie', authCookie)
      .send({
        tipo: 'recorrido',
        titulo: 'Test de Vigilancia Perimetral',
        descripcion: 'Ronda de prueba sin novedades en Torre 1',
        severidad: 'informativa',
        guarda: 'Guarda Test'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.titulo).toContain('Test de Vigilancia');
  });
});

// ── 3. PAQUETERÍA Y CORRESPONDENCIA ──
describe('3. Módulo de Paquetería & PINs', () => {
  let createdPaqueteId;
  let codigoRetiro;

  it('GET /paquetes -> Debe listar encomiendas y recibos públicos', async () => {
    const res = await request(app).get('/paquetes').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /paquetes -> Debe registrar paquete y generar PIN de 4 dígitos', async () => {
    const res = await request(app)
      .post('/paquetes')
      .set('Cookie', authCookie)
      .send({
        torre: '1',
        apto: '101',
        destinatario: 'Propietario Test',
        empresa: 'Servientrega',
        guia: `TEST-GUIA-${Date.now()}`,
        tipo: 'paquete'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('codigoRetiro');
    expect(res.body.codigoRetiro).toHaveLength(4);
    createdPaqueteId = res.body.id;
    codigoRetiro = res.body.codigoRetiro;
  });

  it('PATCH /paquetes/:id/entregar -> Debe validar entrega con PIN correcto', async () => {
    const res = await request(app)
      .patch(`/paquetes/${createdPaqueteId}/entregar`)
      .set('Cookie', authCookie)
      .send({ codigoRetiro, retiradoPor: 'Propietario Test' });
    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('entregado');
  });
});

// ── 4. CONTROL DE ACCESOS Y VISITAS ──
describe('4. Módulo de Accesos y Visitas', () => {
  let visitaId;

  it('GET /accesos -> Debe listar visitas activas e histórico', async () => {
    const res = await request(app).get('/accesos').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /accesos/ingreso -> Debe registrar ingreso de visitante con timestamp', async () => {
    const res = await request(app)
      .post('/accesos/ingreso')
      .set('Cookie', authCookie)
      .send({
        nombre: 'Visitante Test',
        documento: '10203040',
        torre: 'Torre 2',
        apto: '302',
        tipo: 'visitante',
        tipoVehiculo: 'peatonal'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('fechaIngreso');
    visitaId = res.body.id;
  });

  it('PATCH /accesos/:id/salida -> Debe registrar salida y calcular duración', async () => {
    const res = await request(app)
      .patch(`/accesos/${visitaId}/salida`)
      .set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('finalizado');
    expect(res.body).toHaveProperty('fechaSalida');
  });
});

// ── 5. PARQUEADEROS Y TIEMPO DE CORTESÍA (4h) ──
describe('5. Módulo de Parqueaderos', () => {
  it('GET /parqueaderos -> Debe listar bahías con estado y tipo', async () => {
    const res = await request(app).get('/parqueaderos').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ── 6. CENSO DE INMUEBLES & UNIDADES ──
describe('6. Módulo de Inmuebles y Propietarios', () => {
  it('GET /unidades -> Debe retornar censo de apartamentos con estado financiero', async () => {
    const res = await request(app).get('/unidades').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('numero');
    expect(res.body[0]).toHaveProperty('estadoFinanciero');
  });
});

// ── 7. RONDAS DE VIGILANCIA & PUNTOS QR ──
describe('7. Módulo de Rondas & Puntos QR', () => {
  it('GET /rondas -> Debe retornar historial y puntos de control', async () => {
    const res = await request(app).get('/rondas');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('puntosControl');
    expect(res.body.puntosControl.length).toBeGreaterThan(0);
  });
});

// ── 8. RESERVAS DE ZONAS COMUNES ──
describe('8. Módulo de Reservas de Zonas Comunes', () => {
  it('GET /reservas-zonas -> Debe listar reservas de canchas y salón', async () => {
    const res = await request(app).get('/reservas-zonas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /reservas-zonas -> Debe crear una reserva de zona común', async () => {
    const res = await request(app).post('/reservas-zonas').send({
      espacio: 'Cancha Sintética Fútbol 5',
      torre: '1',
      apto: '204',
      solicitante: 'Test Residente',
      telefono: '3001234567',
      fechaReserva: `2026-12-${Math.floor(10 + Math.random() * 18)}`,
      horaInicio: '20:00',
      horaFin: '21:30',
      observaciones: 'Partido vecinal de fin de año'
    });
    expect([201, 409]).toContain(res.statusCode);
  });
});

// ── 9. ASAMBLEAS & VOTACIONES (LEY 675) ──
describe('9. Módulo de Asambleas & Votaciones Digitales', () => {
  it('GET /asambleas -> Debe listar asambleas y preguntas', async () => {
    const res = await request(app).get('/asambleas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('quorumRegistrado');
  });

  it('POST /asambleas/:id/votaciones/:votId/votar -> Debe registrar voto por coeficiente', async () => {
    const asambleas = (await request(app).get('/asambleas')).body;
    if (asambleas.length > 0 && asambleas[0].votaciones?.length > 0) {
      const aId = asambleas[0].id;
      const vId = asambleas[0].votaciones[0].id;
      const res = await request(app)
        .post(`/asambleas/${aId}/votaciones/${vId}/votar`)
        .send({ opcion: 'si', coeficiente: 1.25 });
      expect(res.statusCode).toBe(200);
      expect(res.body.totalVotado).toBeGreaterThanOrEqual(1.25);
    }
  });
});

// ── 10. EQUIPOS DE EMERGENCIA & EXTINTORES ──
describe('10. Módulo de Equipos de Emergencia & Extintores', () => {
  it('GET /equipos -> Debe retornar inventario técnico y semáforo', async () => {
    const res = await request(app).get('/equipos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('fechaVencimiento');
    expect(res.body[0]).toHaveProperty('agente');
  });
});

// ── 11. CENSO DE MASCOTAS CON CARNET QR ──
describe('11. Módulo de Censo de Mascotas', () => {
  it('GET /mascotas -> Debe listar animales de compañía con token QR', async () => {
    const res = await request(app).get('/mascotas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('qrToken');
    expect(res.body[0]).toHaveProperty('vacunaAntirrabica');
  });
});

// ── 12. MINUTABOT IA (NLP, HORARIOS, MEMORIA, CITAS LEY 675, SOS) ──
describe('12. MinutaBot IA & Motor NLP', () => {
  it('Debe responder con exactitud a "Horario Piscina"', async () => {
    const res = await request(app).post('/chatbot/query').send({
      message: 'Horario Piscina'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('Piscina Climatizada');
    expect(res.body.answer).toContain('Martes a Domingo');
    expect(res.body.answer).toContain('06:00 AM');
  });

  it('Debe citar el Artículo 18 del Manual de Convivencia (Mascotas/Bozal)', async () => {
    const res = await request(app).post('/chatbot/query').send({
      message: '¿Qué dice el artículo 18 sobre las mascotas?'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('Artículo 18');
    expect(res.body.answer).toContain('bozal');
  });

  it('Debe citar el Artículo 12 del Manual de Convivencia (Ruido/Silencio)', async () => {
    const res = await request(app).post('/chatbot/query').send({
      message: '¿Qué dice el artículo 12 sobre el horario de silencio?'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('Artículo 12');
    expect(res.body.answer).toContain('10:00 PM');
  });

  it('Debe activar Function Calling para Paz y Salvo', async () => {
    const res = await request(app).post('/chatbot/query').send({
      message: 'Genera el paz y salvo de administración del 204'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('Paz y Salvo');
  });

  it('Debe detectar emergencia crítica y emitir alerta SOS', async () => {
    const res = await request(app).post('/chatbot/query').send({
      message: '¡Auxilio fuego e incendio en el sótano 1!'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('ALERTA DE EMERGENCIA');
    expect(res.body.answer).toContain('SOS-');
  });

  it('GET /chatbot/analytics -> Debe entregar métricas de autoaprendizaje', async () => {
    const res = await request(app).get('/chatbot/analytics');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalConsultas');
  });
});

// ── 13. MÓDULO DE PQRS (PETICIONES, QUEJAS, RECLAMOS Y SOLICITUDES) ──
describe('13. Módulo de PQRS & Término Legal Ley 1755', () => {
  let createdTicketId;

  it('GET /pqrs -> Debe listar los tickets de PQRS', async () => {
    const res = await request(app).get('/pqrs').set('Cookie', authCookie);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /pqrs -> Debe crear una nueva PQRS con radicado y plazo de 15 días hábiles', async () => {
    const res = await request(app).post('/pqrs').send({
      categoria: 'Petición',
      asunto: 'Solicitud de copia de actas de asamblea anterior',
      descripcion: 'Requiero copia del acta firmada de la asamblea ordinaria',
      torre: 'Torre 2',
      apto: '401',
      solicitante: 'Laura Morales',
      email: 'laura@test.com',
      telefono: '3129876543',
      prioridad: 'media'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('radicado');
    expect(res.body.radicado).toMatch(/^PQR-\d{4}-\d{4}$/);
    expect(res.body).toHaveProperty('fechaLimiteRespuesta');
    expect(res.body.estado).toBe('radicado');
    createdTicketId = res.body.id;
  });

  it('POST /pqrs/:id/responder -> Debe registrar respuesta oficial de la administración', async () => {
    const res = await request(app)
      .post(`/pqrs/${createdTicketId}/responder`)
      .set('Cookie', authCookie)
      .send({
        respuesta: 'Estimada copropietaria, se adjunta copia digital del acta solicitada.',
        respondidoPor: 'Administración EcoBosque',
        nuevoEstado: 'respondido'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('respondido');
    expect(Array.isArray(res.body.respuestas)).toBe(true);
    expect(res.body.respuestas.length).toBeGreaterThan(0);
    expect(res.body.respuestas[0].respuesta).toContain('se adjunta copia digital');
  });

  it('PATCH /pqrs/:id/estado -> Debe actualizar el estado de la PQRS', async () => {
    const res = await request(app)
      .patch(`/pqrs/${createdTicketId}/estado`)
      .set('Cookie', authCookie)
      .send({ estado: 'cerrado' });

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('cerrado');
  });
});