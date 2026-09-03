'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/rondasController');

router.get('/', controller.getAllRondas);
router.post('/registrar', controller.registrarPuntoRonda);
router.post('/puntos', controller.createPuntoControl);

module.exports = router;