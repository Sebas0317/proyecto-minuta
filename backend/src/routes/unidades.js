'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/unidadesController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');

// Rutas del Portal del Residente
router.get('/public/list', controller.getPublicUnidadesSummary);
router.get('/portal/:id', controller.getUnidadPortalData);

router.get('/', optionalAuth, controller.getAllUnidades);
router.get('/:id', optionalAuth, controller.getUnidadById);
router.post('/', requireAuth, requirePermission('unidades:write'), controller.createUnidad);
router.put('/:id', requireAuth, requirePermission('unidades:write'), controller.updateUnidad);
router.delete('/:id', requireAuth, requirePermission('unidades:delete'), controller.deleteUnidad);

module.exports = router;
