const express = require('express');
const router = express.Router();
const controller = require('../controllers/equiposController');

router.get('/', controller.getEquipos);
router.post('/', controller.createEquipo);
router.put('/:id', controller.updateEquipo);
router.delete('/:id', controller.deleteEquipo);

module.exports = router;
