const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tutorSchema = new mongoose.Schema({
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
  bio: {
    type: String,
    maxlength: 1000
  },
  experience: {
    type: Number,
    min: 0
  },
  education: String,
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    }
  }],
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
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
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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
  receivedAt: {
    type: Date,
    default: Date.now
  }
}],

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

tutorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

tutorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Tutor', tutorSchema);
