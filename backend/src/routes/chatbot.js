'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbotController');

router.post('/query', controller.queryChatbot);
router.get('/knowledge', controller.getAllKnowledge);
router.post('/knowledge', controller.addKnowledgeItem);
router.put('/knowledge/:id', controller.updateKnowledgeItem);
router.delete('/knowledge/:id', controller.deleteKnowledgeItem);
router.get('/unanswered', controller.getUnansweredList);
router.delete('/unanswered/:id', controller.deleteUnanswered);

module.exports = router;