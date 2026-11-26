'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/integracionesController');
const { readRateLimiter } = require('../middleware/rateLimiters');

router.get('/contexto-operativo', readRateLimiter, controller.getContextoOperativo);
router.get('/festivos', readRateLimiter, controller.getFestivosHandler);

module.exports = router;
