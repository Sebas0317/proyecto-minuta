'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/trasteosController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', requireAuth, requirePermission('trasteos:read'), controller.getAllTrasteos);
router.post('/', requireAuth, requirePermission('trasteos:write'), controller.createTrasteo);
router.patch('/:id/estado', requireAuth, requirePermission('trasteos:approve'), controller.updateTrasteoEstado);

module.exports = router;
