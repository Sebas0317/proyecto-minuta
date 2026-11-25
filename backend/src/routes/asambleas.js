'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/asambleasController');
const { requirePermissionIfAuthed } = require('../middleware/auth');

router.get('/', controller.getAsambleas);
router.post('/', requirePermissionIfAuthed('asambleas:manage'), controller.createAsamblea);
router.patch('/:id/quorum', requirePermissionIfAuthed('asambleas:manage'), controller.updateQuorum);
router.post('/:id/votaciones', requirePermissionIfAuthed('asambleas:manage'), controller.addVotacion);
router.post('/:id/votaciones/:votId/votar', requirePermissionIfAuthed('asambleas:vote'), controller.castVote);
router.patch('/:id/votaciones/:votId/cerrar', requirePermissionIfAuthed('asambleas:manage'), controller.closeVotacion);

module.exports = router;
