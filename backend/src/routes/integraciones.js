'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/integracionesController');

router.get('/contexto-operativo', controller.getContextoOperativo);
router.get('/festivos', controller.getFestivosHandler);

module.exports = router;
