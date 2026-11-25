'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/accesosController');
const { requireAuth, optionalAuth, requirePermission, requirePermissionIfAuthed } = require('../middleware/auth');

router.get('/', optionalAuth, controller.getAllAccesos);
router.post('/ingreso', requireAuth, requirePermission('accesos:write'), controller.registrarIngreso);
router.patch('/:id/salida', requireAuth, requirePermission('accesos:write'), controller.registrarSalida);

// Pre-autorizaciones (Portal del Residente y Validación de Guardia)
router.post('/preautorizar', controller.preautorizarIngreso);
router.get('/preautorizados/:unidadId', controller.getPreautorizadosByUnidad);
router.patch('/:id/aprobar-preautorizado', requirePermissionIfAuthed('accesos:write'), controller.aprobarPreautorizado);

module.exports = router;
