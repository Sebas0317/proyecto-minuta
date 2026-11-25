'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/parqueaderoController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');

router.get('/', optionalAuth, controller.getAllParqueaderos);
router.patch('/:id/ocupar', requireAuth, requirePermission('parqueaderos:write'), controller.ocuparParqueadero);
router.patch('/:id/liberar', requireAuth, requirePermission('parqueaderos:write'), controller.liberarParqueadero);
router.post('/reportar-invasion', requireAuth, requirePermission('parqueaderos:write'), controller.reportarInvasion);
router.post('/reubicar-invasion', requireAuth, requirePermission('parqueaderos:write'), controller.reubicarInvasion);
router.patch('/:id/liberar-invasion', requireAuth, requirePermission('parqueaderos:write'), controller.liberarInvasion);

module.exports = router;
