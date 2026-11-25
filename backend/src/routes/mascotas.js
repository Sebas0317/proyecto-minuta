'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mascotasController');
const { requirePermissionIfAuthed } = require('../middleware/auth');

router.get('/', controller.getMascotas);
router.post('/', controller.createMascota);
router.put('/:id', requirePermissionIfAuthed('mascotas:write'), controller.updateMascota);
router.delete('/:id', requirePermissionIfAuthed('mascotas:delete'), controller.deleteMascota);

module.exports = router;
