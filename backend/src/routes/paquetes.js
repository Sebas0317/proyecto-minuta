'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/paqueteriaController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { pinCompoundRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, controller.getAllPaquetes);
router.get('/unidad/:apto', controller.getPaquetesByApto);
router.post('/', optionalAuth, controller.createPaquete);
router.patch('/:id/notificar', optionalAuth, controller.notificarPaquete);
router.patch('/:id/entregar', pinCompoundRateLimiter, optionalAuth, controller.entregarPaquete);

module.exports = router;
