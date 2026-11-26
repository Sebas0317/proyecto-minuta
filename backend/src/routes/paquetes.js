'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/paqueteriaController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { pinCompoundRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, controller.getAllPaquetes);
router.get('/unidad/:apto', optionalAuth, controller.getPaquetesByApto);
router.post('/', requireAuth, requirePermission('paquetes:write'), controller.createPaquete);
router.patch('/:id/notificar', requireAuth, requirePermission('paquetes:write'), controller.notificarPaquete);
router.patch('/:id/entregar', requireAuth, requirePermission('paquetes:write'), pinCompoundRateLimiter, controller.entregarPaquete);

module.exports = router;
