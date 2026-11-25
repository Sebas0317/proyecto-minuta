'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/rondasController');
const { requirePermissionIfAuthed } = require('../middleware/auth');

router.get('/', controller.getAllRondas);
router.post('/registrar', requirePermissionIfAuthed('rondas:write'), controller.registrarPuntoRonda);
router.post('/puntos', requirePermissionIfAuthed('rondas:manage'), controller.createPuntoControl);

module.exports = router;
