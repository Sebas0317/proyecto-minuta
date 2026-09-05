'use strict';

const express = require('express');
const router = express.Router();
const pqrsController = require('../controllers/pqrsController');
const { requireAuth } = require('../middleware/auth');
const { readRateLimiter, writeRateLimiter } = require('../middleware/rateLimiters');

router.get('/', readRateLimiter, pqrsController.getAllPqrs);
router.get('/:id', readRateLimiter, pqrsController.getPqrsById);
router.post('/', writeRateLimiter, pqrsController.createPqrs);
router.post('/:id/responder', requireAuth, writeRateLimiter, pqrsController.responderPqrs);
router.patch('/:id/responder', requireAuth, writeRateLimiter, pqrsController.responderPqrs);
router.patch('/:id/estado', requireAuth, writeRateLimiter, pqrsController.updatePqrsEstado);
router.delete('/:id', requireAuth, writeRateLimiter, pqrsController.deletePqrs);

module.exports = router;

