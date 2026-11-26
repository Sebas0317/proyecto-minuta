'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mascotasController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { writeRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, controller.getMascotas);
router.post('/', optionalAuth, writeRateLimiter, controller.createMascota);
router.put('/:id', requireAuth, requirePermission('mascotas:write'), controller.updateMascota);
router.delete('/:id', requireAuth, requirePermission('mascotas:delete'), controller.deleteMascota);

module.exports = router;
