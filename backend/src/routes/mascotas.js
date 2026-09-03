const express = require('express');
const router = express.Router();
const controller = require('../controllers/mascotasController');

router.get('/', controller.getMascotas);
router.post('/', controller.createMascota);
router.put('/:id', controller.updateMascota);
router.delete('/:id', controller.deleteMascota);

module.exports = router;
