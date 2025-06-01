const express = require('express');
const {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markMessageAsRead,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations', createConversation);
router.post('/messages', sendMessage);
router.put('/messages/:messageId/read', markMessageAsRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;
