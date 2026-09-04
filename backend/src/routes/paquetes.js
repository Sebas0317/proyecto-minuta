'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/paqueteriaController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { pinCompoundRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, controller.getAllPaquetes);
router.get('/unidad/:apto', controller.getPaquetesByApto);
router.post('/', requireAuth, controller.createPaquete);
router.patch('/:id/notificar', requireAuth, controller.notificarPaquete);
router.patch('/:id/entregar', requireAuth, pinCompoundRateLimiter, controller.entregarPaquete);

module.exports = router;
