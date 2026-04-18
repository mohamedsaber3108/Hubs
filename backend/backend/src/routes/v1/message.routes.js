'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/message.controller');
const { authenticate } = require('../../middleware/auth');

// All message routes require auth
router.use(authenticate);

router.get('/',                                    ctrl.listConversations);
router.post('/',                                   ctrl.startConversation);
router.get('/:conversationId',                     ctrl.getMessages);
router.post('/:conversationId',                    ctrl.sendMessage);
router.get('/:conversationId/participants',        ctrl.getParticipants);
router.delete('/:conversationId/messages/:messageId', ctrl.deleteMessage);

module.exports = router;
