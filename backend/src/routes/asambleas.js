'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/asambleasController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { writeRateLimiter } = require('../middleware/rateLimiters');

router.get('/', controller.getAsambleas);
router.post('/', requireAuth, requirePermission('asambleas:manage'), controller.createAsamblea);
router.patch('/:id/quorum', requireAuth, requirePermission('asambleas:manage'), controller.updateQuorum);
router.post('/:id/votaciones', requireAuth, requirePermission('asambleas:manage'), controller.addVotacion);
router.post('/:id/votaciones/:votId/votar', optionalAuth, writeRateLimiter, controller.castVote);
router.patch('/:id/votaciones/:votId/cerrar', requireAuth, requirePermission('asambleas:manage'), controller.closeVotacion);

module.exports = router;
