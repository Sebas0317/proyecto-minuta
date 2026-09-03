'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/minutaController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, controller.getAllMinuta);
router.get('/stats', requireAuth, controller.getMinutaStats);
router.post('/', requireAuth, controller.createMinutaEntry);

module.exports = router;
