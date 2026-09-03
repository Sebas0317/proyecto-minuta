'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/minutaController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, controller.getAllMinuta);
router.get('/stats', optionalAuth, controller.getMinutaStats);
router.post('/', requireAuth, controller.createMinutaEntry);

module.exports = router;
