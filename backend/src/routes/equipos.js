'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/equiposController');
const { requirePermissionIfAuthed } = require('../middleware/auth');

router.get('/', controller.getEquipos);
router.post('/', requirePermissionIfAuthed('equipos:write'), controller.createEquipo);
router.put('/:id', requirePermissionIfAuthed('equipos:write'), controller.updateEquipo);
router.delete('/:id', requirePermissionIfAuthed('equipos:delete'), controller.deleteEquipo);

module.exports = router;
