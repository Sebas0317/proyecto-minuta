'use strict';

const rateLimit = require('express-rate-limit');
const { UpstashStore } = require('./rateLimitStore');

function makeStore(prefix) {
  return new UpstashStore(prefix);
}

function createLimiter(opts) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    ...opts,
  });
}

const globalRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  store: makeStore('rl:global:'),
  message: {
    error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.',
  },
});

const authRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  store: makeStore('rl:auth:'),
  message: {
    error: 'Demasiados intentos de inicio de sesion. Intenta en un minuto.',
  },
});

const readRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  store: makeStore('rl:read:'),
  message: {
    error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.',
  },
});

const writeRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  store: makeStore('rl:write:'),
  message: {
    error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.',
  },
});

const pinRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  store: makeStore('rl:pin:'),
  message: { error: 'Demasiados intentos de PIN. Espera un minuto.' },
});

const loginLimiter = createLimiter({
  windowMs: 120 * 1000,
  max: 5,
  store: makeStore('rl:login:'),
  message: {
    error: 'Demasiados intentos de inicio de sesion. Espera 2 minutos.',
  },
});

const codeVerifyLimiter = createLimiter({
  windowMs: 120 * 1000,
  max: 5,
  store: makeStore('rl:code:'),
  message: { error: 'Demasiados intentos de verificacion. Espera 2 minutos.' },
});

const recoveryLimiter = createLimiter({
  windowMs: 120 * 1000,
  max: 3,
  store: makeStore('rl:recovery:'),
  message: {
    error: 'Demasiadas solicitudes de recuperacion. Espera 2 minutos.',
  },
});

const emailCodeLimiter = createLimiter({
  windowMs: 300 * 1000,
  max: 2,
  store: makeStore('rl:email:'),
  message: { error: 'Demasiadas solicitudes de codigo. Espera 5 minutos.' },
});

// ── RATE LIMITER COMPUESTO PARA VALIDACIÓN DE PINs (IP + RECURSO) ──
const pinIpStore = makeStore('rl:pin:ip:');
const pinTargetStore = makeStore('rl:pin:target:');
const PIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_PIN_ATTEMPTS = 5;

pinIpStore.windowMs = PIN_WINDOW_MS;
pinTargetStore.windowMs = PIN_WINDOW_MS;

async function pinCompoundRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const target = req.params?.id || req.body?.unidadId || req.body?.apto || 'global_target';

  try {
    const ipKey = String(ip).trim();
    const targetKey = String(target).trim();

    const ipResult = await pinIpStore.increment(ipKey);
    const targetResult = await pinTargetStore.increment(targetKey);

    if (ipResult.totalHits > MAX_PIN_ATTEMPTS || targetResult.totalHits > MAX_PIN_ATTEMPTS) {
      return res.status(429).json({
        error: 'Demasiados intentos de PIN. Bloqueado temporalmente por seguridad.',
        retryAfterMinutes: 15
      });
    }

    // Helper en caso de que el intento sea exitoso para resetear contadores
    req.onPinSuccess = async () => {
      await Promise.all([
        pinIpStore.resetKey(ipKey),
        pinTargetStore.resetKey(targetKey)
      ]).catch(() => {});
    };

    next();
  } catch {
    next();
  }
}

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  readRateLimiter,
  writeRateLimiter,
  pinRateLimiter,
  pinCompoundRateLimiter,
  loginLimiter,
  codeVerifyLimiter,
  recoveryLimiter,
  emailCodeLimiter,
  pinIpStore,
  pinTargetStore
};
