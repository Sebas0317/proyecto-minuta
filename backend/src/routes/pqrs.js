'use strict';

const express = require('express');
const router = express.Router();
const pqrsController = require('../controllers/pqrsController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { readRateLimiter, writeRateLimiter } = require('../middleware/rateLimiters');

router.get('/', optionalAuth, readRateLimiter, pqrsController.getAllPqrs);
router.get('/:id', optionalAuth, readRateLimiter, pqrsController.getPqrsById);
router.post('/', writeRateLimiter, pqrsController.createPqrs);
router.post('/:id/responder', requireAuth, requirePermission('pqrs:write'), writeRateLimiter, pqrsController.responderPqrs);
router.patch('/:id/responder', requireAuth, requirePermission('pqrs:write'), writeRateLimiter, pqrsController.responderPqrs);
router.patch('/:id/estado', requireAuth, requirePermission('pqrs:write'), writeRateLimiter, pqrsController.updatePqrsEstado);
router.delete('/:id', requireAuth, requirePermission('pqrs:delete'), writeRateLimiter, pqrsController.deletePqrs);

module.exports = router;
