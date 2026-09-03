'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/unidadesController');
const { requireAuth } = require('../middleware/auth');

// Rutas del Portal del Residente
router.get('/public/list', controller.getPublicUnidadesSummary);
router.get('/portal/:id', controller.getUnidadPortalData);

router.get('/', requireAuth, controller.getAllUnidades);
router.get('/:id', requireAuth, controller.getUnidadById);
router.post('/', requireAuth, controller.createUnidad);
router.put('/:id', requireAuth, controller.updateUnidad);
router.delete('/:id', requireAuth, controller.deleteUnidad);

module.exports = router;
