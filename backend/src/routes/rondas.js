'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/rondasController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', controller.getAllRondas);
router.post('/registrar', requireAuth, requirePermission('rondas:write'), controller.registrarPuntoRonda);
router.post('/puntos', requireAuth, requirePermission('rondas:manage'), controller.createPuntoControl);

module.exports = router;
