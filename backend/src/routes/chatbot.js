'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatbotController');
const { requireAuth, optionalAuth, requirePermission } = require('../middleware/auth');
const { writeRateLimiter } = require('../middleware/rateLimiters');

router.post('/query', optionalAuth, writeRateLimiter, controller.queryChatbot);
router.get('/knowledge', controller.getAllKnowledge);
router.post('/knowledge', requireAuth, requirePermission('chatbot:write'), controller.addKnowledgeItem);
router.put('/knowledge/:id', requireAuth, requirePermission('chatbot:write'), controller.updateKnowledgeItem);
router.delete('/knowledge/:id', requireAuth, requirePermission('chatbot:delete'), controller.deleteKnowledgeItem);
router.get('/unanswered', requireAuth, requirePermission('chatbot:read'), controller.getUnansweredList);
router.delete('/unanswered/:id', requireAuth, requirePermission('chatbot:delete'), controller.deleteUnanswered);
router.get('/analytics', optionalAuth, controller.getAnalytics);

module.exports = router;
