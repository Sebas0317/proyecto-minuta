'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbotController');
const { requirePermissionIfAuthed } = require('../middleware/auth');

router.post('/query', controller.queryChatbot);
router.get('/knowledge', controller.getAllKnowledge);
router.post('/knowledge', requirePermissionIfAuthed('chatbot:write'), controller.addKnowledgeItem);
router.put('/knowledge/:id', requirePermissionIfAuthed('chatbot:write'), controller.updateKnowledgeItem);
router.delete('/knowledge/:id', requirePermissionIfAuthed('chatbot:delete'), controller.deleteKnowledgeItem);
router.get('/unanswered', controller.getUnansweredList);
router.delete('/unanswered/:id', requirePermissionIfAuthed('chatbot:delete'), controller.deleteUnanswered);
router.get('/analytics', controller.getAnalytics);

module.exports = router;
