'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/equiposController');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.get('/', controller.getEquipos);
router.post('/', requireAuth, requirePermission('equipos:write'), controller.createEquipo);
router.put('/:id', requireAuth, requirePermission('equipos:write'), controller.updateEquipo);
router.delete('/:id', requireAuth, requirePermission('equipos:delete'), controller.deleteEquipo);

module.exports = router;
