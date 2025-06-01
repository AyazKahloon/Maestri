const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: String,
  location: {
    city: String,
    country: String
  },
  tutorsAdded: [{
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor'
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  requests: [{
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: false  // Changed from true to false
  },
  message: {
    type: String,
    required: true
  },
  preferredTime: String,
  sessionType: {
    type: String,
    enum: ['video', 'chat', 'in-person'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
