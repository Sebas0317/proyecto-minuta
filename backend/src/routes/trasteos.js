'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/trasteosController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, controller.getAllTrasteos);
router.post('/', requireAuth, controller.createTrasteo);
router.patch('/:id/estado', requireAuth, controller.updateTrasteoEstado);

module.exports = router;
