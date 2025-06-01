const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  lastMessage: {
    content: String,
    sender: {
      type: String,
      enum: ['student', 'tutor']
    },
    sentAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one conversation per student-tutor pair
conversationSchema.index({ student: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
