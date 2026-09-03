'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/parqueaderoController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, controller.getAllParqueaderos);
router.patch('/:id/ocupar', requireAuth, controller.ocuparParqueadero);
router.patch('/:id/liberar', requireAuth, controller.liberarParqueadero);
router.post('/reportar-invasion', requireAuth, controller.reportarInvasion);
router.post('/reubicar-invasion', requireAuth, controller.reubicarInvasion);
router.patch('/:id/liberar-invasion', requireAuth, controller.liberarInvasion);

module.exports = router;