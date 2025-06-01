const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
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
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check if user is a tutor
const tutorOnly = (req, res, next) => {
  if (req.user.userType !== 'tutor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tutors only.'
    });
  }
  next();
};

// Middleware to check if user is a student
const studentOnly = (req, res, next) => {
  if (req.user.userType !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Students only.'
    });
  }
  next();
};

// Middleware to check if user is either student or tutor (authenticated user)
const authenticatedUser = (req, res, next) => {
  if (!req.user.userType || (req.user.userType !== 'student' && req.user.userType !== 'tutor')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }
  next();
};

// Middleware to check if tutor is verified (for sensitive operations)
const verifiedTutorOnly = (req, res, next) => {
  if (req.user.userType !== 'tutor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tutors only.'
    });
  }
  
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tutor verification required.'
    });
  }
  
  next();
};

module.exports = {
  protect,
  tutorOnly,
  studentOnly,
  authenticatedUser,
  verifiedTutorOnly
};
