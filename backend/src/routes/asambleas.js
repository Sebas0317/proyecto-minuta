const express = require('express');
const router = express.Router();
const controller = require('../controllers/asambleasController');

router.get('/', controller.getAsambleas);
router.post('/', controller.createAsamblea);
router.patch('/:id/quorum', controller.updateQuorum);
router.post('/:id/votaciones', controller.addVotacion);
router.post('/:id/votaciones/:votId/votar', controller.castVote);
router.patch('/:id/votaciones/:votId/cerrar', controller.closeVotacion);

module.exports = router;
