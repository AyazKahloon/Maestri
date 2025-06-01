const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }
}, {
  timestamps: true
});

// Ensure one review per student-tutor pair
reviewSchema.index({ student: 1, tutor: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
