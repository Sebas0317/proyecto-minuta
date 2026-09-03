'use strict';

/**
 * Sanitize string inputs to prevent XSS.
 * Strips dangerous content but PRESERVES Unicode/accents — does NOT HTML-escape.
 * HTML escaping se hace SOLO en el frontend al renderizar.
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

/**
 * Middleware that sanitizes all string fields in req.body.
 */
function sanitizeBody(req, _res, next) {
  if (!req.body || typeof req.body !== 'object') return next();

  if (Array.isArray(req.body)) {
    for (let i = 0; i < req.body.length; i++) {
      if (typeof req.body[i] === 'string') {
        req.body[i] = sanitizeString(req.body[i]);
      }
    }
    return next();
  }

  const cleaned = Object.assign({}, req.body);
  for (const [key, value] of Object.entries(req.body)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete cleaned[key];
      continue;
    }
    if (typeof value === 'string') {
      Object.defineProperty(cleaned, key, {
        value: sanitizeString(value),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  req.body = cleaned;

  next();
}

module.exports = { sanitizeBody, sanitizeString };
