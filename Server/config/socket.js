const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = null;
    
    // Check if user is a student
    if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id).select('-password');
      if (user) {
        user.userType = 'student';
      }
    } 
    // Check if user is a tutor
    else if (decoded.userType === 'tutor') {
      user = await Tutor.findById(decoded.id).select('-password');
      if (user) {
        user.userType = 'tutor';
      }
    }
    
    if (!user) {
      return next(new Error('User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new Error('Account is deactivated'));
    }

    socket.userId = user._id.toString();
    socket.userType = user.userType;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

module.exports = { socketAuth };
