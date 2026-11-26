'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/accesosController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { writeRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, controller.getAllAccesos);
router.post('/ingreso', requireAuth, requirePermission('accesos:write'), controller.registrarIngreso);
router.patch('/:id/salida', requireAuth, requirePermission('accesos:write'), controller.registrarSalida);

// Pre-autorizaciones (Portal del Residente y Validación de Guardia)
router.post('/preautorizar', optionalAuth, writeRateLimiter, controller.preautorizarIngreso);
router.get('/preautorizados/:unidadId', optionalAuth, controller.getPreautorizadosByUnidad);
router.patch('/:id/aprobar-preautorizado', requireAuth, requirePermission('accesos:write'), controller.aprobarPreautorizado);

module.exports = router;
