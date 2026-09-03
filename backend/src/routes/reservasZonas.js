'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservasZonasController');

router.get('/', controller.getAllReservas);
router.post('/', controller.createReserva);
router.patch('/:id/estado', controller.updateEstadoReserva);

module.exports = router;