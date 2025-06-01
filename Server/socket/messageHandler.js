const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');

const handleMessage = (io, socket) => {
  // Join conversation room
  socket.on('join_conversation', async (conversationId) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Check if user is authorized to join this conversation
      const isAuthorized = (socket.userType === 'student' && conversation.student.toString() === socket.userId) ||
                           (socket.userType === 'tutor' && conversation.tutor.toString() === socket.userId);

      if (!isAuthorized) {
        socket.emit('error', { message: 'Access denied to this conversation' });
        return;
      }

      socket.join(conversationId);
      socket.emit('joined_conversation', { conversationId });
      
      // Notify other participant that user joined
      socket.to(conversationId).emit('user_joined', {
        userId: socket.userId,
        userType: socket.userType,
        userName: `${socket.user.firstName} ${socket.user.lastName}`
      });

    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content } = data;

      if (!conversationId || !content || !content.trim()) {
        socket.emit('error', { message: 'Conversation ID and content are required' });
        return;
      }

      // Verify user is part of conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Check authorization
      const isAuthorized = (socket.userType === 'student' && conversation.student.toString() === socket.userId) ||
                           (socket.userType === 'tutor' && conversation.tutor.toString() === socket.userId);

      if (!isAuthorized) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Create new message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userType,
        senderId: socket.userId,
        content: content.trim()
      });

      // Populate sender info
      await message.populate({
        path: 'senderId',
        select: 'firstName lastName email',
        model: socket.userType === 'student' ? 'Student' : 'Tutor'
      });

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          content: content.trim(),
          sender: socket.userType,
          sentAt: new Date()
        }
      });

      // Emit to all users in the conversation
      io.to(conversationId).emit('new_message', {
        _id: message._id,
        conversation: message.conversation,
        sender: message.sender,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        isRead: message.isRead
      });

      // Send notification to the other participant if they're not in the room
      const otherParticipantId = socket.userType === 'student' 
        ? conversation.tutor.toString() 
        : conversation.student.toString();
      
      const otherParticipantType = socket.userType === 'student' ? 'tutor' : 'student';
      
      // Check if other participant is online
      const otherParticipantSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === otherParticipantId && s.userType === otherParticipantType);

      if (otherParticipantSocket && !otherParticipantSocket.rooms.has(conversationId)) {
        otherParticipantSocket.emit('new_message_notification', {
          conversationId,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`,
          senderType: socket.userType,
          content: content.trim(),
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message read
  socket.on('mark_read', async (data) => {
    try {
      const { messageId } = data;

      if (!messageId) {
        socket.emit('error', { message: 'Message ID is required' });
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify user is authorized and is not the sender
      const conversation = await Conversation.findById(message.conversation);
      const isAuthorized = (socket.userType === 'student' && conversation.student.toString() === socket.userId) ||
                           (socket.userType === 'tutor' && conversation.tutor.toString() === socket.userId);

      if (!isAuthorized) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Only mark as read if the current user is not the sender
      if (message.sender !== socket.userType) {
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });

        io.to(message.conversation.toString()).emit('message_read', {
          messageId,
          readBy: socket.userType,
          readAt: new Date()
        });
      }

    } catch (error) {
      console.error('Mark read error:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    try {
      const { conversationId } = data;
      
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID is required' });
        return;
      }

      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        userType: socket.userType,
        userName: `${socket.user.firstName} ${socket.user.lastName}`
      });
    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on('typing_stop', (data) => {
    try {
      const { conversationId } = data;
      
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID is required' });
        return;
      }

      socket.to(conversationId).emit('user_stop_typing', {
        userId: socket.userId,
        userType: socket.userType
      });
    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });

  // Handle user going online/offline
  socket.on('user_online', () => {
    try {
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        userType: socket.userType,
        status: 'online'
      });
    } catch (error) {
      console.error('User online error:', error);
    }
  });

  // Handle leaving conversation
  socket.on('leave_conversation', (data) => {
    try {
      const { conversationId } = data;
      
      if (conversationId) {
        socket.leave(conversationId);
        socket.to(conversationId).emit('user_left', {
          userId: socket.userId,
          userType: socket.userType,
          userName: `${socket.user.firstName} ${socket.user.lastName}`
        });
      }
    } catch (error) {
      console.error('Leave conversation error:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    try {
      console.log(`${socket.userType} ${socket.userId} disconnected`);
      
      // Notify other users that this user went offline
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        userType: socket.userType,
        status: 'offline'
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });

  // Handle getting online users
  socket.on('get_online_users', () => {
    try {
      const onlineUsers = Array.from(io.sockets.sockets.values()).map(s => ({
        userId: s.userId,
        userType: s.userType,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown'
      }));

      socket.emit('online_users', onlineUsers);
    } catch (error) {
      console.error('Get online users error:', error);
    }
  });
};

module.exports = handleMessage;
