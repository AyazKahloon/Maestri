const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');

const getConversations = async (req, res) => {
  try {
    let conversations;

    if (req.user.userType === 'student') {
      // Get tutors who have accepted this student
      const student = await Student.findById(req.user.id).populate('tutorsAdded.tutor', 'firstName lastName email');
      
      if (!student || !student.tutorsAdded.length) {
        return res.status(200).json({
          success: true,
          conversations: []
        });
      }

      // Get conversations with accepted tutors
      const tutorIds = student.tutorsAdded.map(ta => ta.tutor._id);
      
      conversations = await Conversation.find({
        student: req.user.id,
        tutor: { $in: tutorIds }
      })
      .populate('student', 'firstName lastName email')
      .populate('tutor', 'firstName lastName email')
      .populate('subject', 'name')
      .sort({ updatedAt: -1 });

      // Create conversations for tutors who don't have one yet
      for (const tutorAdded of student.tutorsAdded) {
        const existingConv = conversations.find(conv => 
          conv.tutor._id.toString() === tutorAdded.tutor._id.toString()
        );
        
        if (!existingConv) {
          const newConv = await Conversation.create({
            student: req.user.id,
            tutor: tutorAdded.tutor._id,
            subject: tutorAdded.subject
          });
          
          await newConv.populate([
            { path: 'student', select: 'firstName lastName email' },
            { path: 'tutor', select: 'firstName lastName email' },
            { path: 'subject', select: 'name' }
          ]);
          
          conversations.push(newConv);
        }
      }
    } else {
      // Get students who are added by this tutor
      const tutor = await Tutor.findById(req.user.id).populate('students.student', 'firstName lastName email');
      
      if (!tutor || !tutor.students.length) {
        return res.status(200).json({
          success: true,
          conversations: []
        });
      }

      // Get conversations with added students
      const studentIds = tutor.students.map(s => s.student._id);
      
      conversations = await Conversation.find({
        tutor: req.user.id,
        student: { $in: studentIds }
      })
      .populate('student', 'firstName lastName email')
      .populate('tutor', 'firstName lastName email')
      .populate('subject', 'name')
      .sort({ updatedAt: -1 });

      // Create conversations for students who don't have one yet
      for (const studentAdded of tutor.students) {
        const existingConv = conversations.find(conv => 
          conv.student._id.toString() === studentAdded.student._id.toString()
        );
        
        if (!existingConv) {
          const newConv = await Conversation.create({
            student: studentAdded.student._id,
            tutor: req.user.id,
            subject: studentAdded.subject
          });
          
          await newConv.populate([
            { path: 'student', select: 'firstName lastName email' },
            { path: 'tutor', select: 'firstName lastName email' },
            { path: 'subject', select: 'name' }
          ]);
          
          conversations.push(newConv);
        }
      }
    }

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is authorized to access this conversation
    const isAuthorized = (req.user.userType === 'student' && conversation.student.toString() === req.user.id) ||
                         (req.user.userType === 'tutor' && conversation.tutor.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate({
        path: 'senderId',
        select: 'firstName lastName email',
        model: function(doc) {
          return doc.sender === 'student' ? 'Student' : 'Tutor';
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const createConversation = async (req, res) => {
  try {
    const { participantId, subjectId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    let studentId, tutorId;

    // Determine student and tutor IDs based on current user type
    if (req.user.userType === 'student') {
      studentId = req.user.id;
      tutorId = participantId;

      // Verify the participant is actually a tutor and student is added
      const tutor = await Tutor.findById(participantId);
      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: 'Tutor not found'
        });
      }

      // Check if student is added by this tutor
      const isStudentAdded = tutor.students.some(s => s.student.toString() === studentId);
      if (!isStudentAdded) {
        return res.status(403).json({
          success: false,
          message: 'You are not connected with this tutor'
        });
      }
    } else {
      tutorId = req.user.id;
      studentId = participantId;

      // Verify the participant is actually a student and is added by tutor
      const student = await Student.findById(participantId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if tutor has added this student
      const tutor = await Tutor.findById(tutorId);
      const isStudentAdded = tutor.students.some(s => s.student.toString() === studentId);
      if (!isStudentAdded) {
        return res.status(403).json({
          success: false,
          message: 'This student is not in your student list'
        });
      }
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      student: studentId,
      tutor: tutorId
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      student: studentId,
      tutor: tutorId,
      subject: subjectId
    });

    await conversation.populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'tutor', select: 'firstName lastName email' },
      { path: 'subject', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and content are required'
      });
    }

    // Verify conversation exists and user is authorized
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is authorized to send message in this conversation
    const isAuthorized = (req.user.userType === 'student' && conversation.student.toString() === req.user.id) ||
                         (req.user.userType === 'tutor' && conversation.tutor.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.userType,
      senderId: req.user.id,
      content: content.trim()
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: req.user.userType,
      sentAt: new Date()
    };
    await conversation.save();

    // Populate sender information
    await message.populate({
      path: 'senderId',
      select: 'firstName lastName email',
      model: req.user.userType === 'student' ? 'Student' : 'Tutor'
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is authorized to mark this message as read
    const conversation = await Conversation.findById(message.conversation);
    const isAuthorized = (req.user.userType === 'student' && conversation.student.toString() === req.user.id) ||
                         (req.user.userType === 'tutor' && conversation.tutor.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only mark as read if the current user is not the sender
    if (message.sender !== req.user.userType) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    let conversations;

    // Get all conversations for the user
    if (req.user.userType === 'student') {
      conversations = await Conversation.find({
        student: req.user.id
      }).select('_id');
    } else {
      conversations = await Conversation.find({
        tutor: req.user.id
      }).select('_id');
    }

    const conversationIds = conversations.map(conv => conv._id);

    // Count unread messages where the user is not the sender
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user.userType },
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markMessageAsRead,
  getUnreadCount
};
