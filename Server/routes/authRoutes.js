const express = require('express');

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  addSubject,
  removeSubject,
  getAvailableTutors,
  sendRequestToTutor,
  getTutorRequests,
  acceptStudentRequest,
  declineStudentRequest
} = require('../controllers/authController');


const { protect, tutorOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
// Public route to get available tutors
router.get('/tutors', getAvailableTutors);


// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Tutor-only routes
router.post('/subjects', protect, tutorOnly, addSubject);
router.delete('/subjects/:subjectId', protect, tutorOnly, removeSubject);

// Student-only route to send request to tutor
router.post('/send-request', protect, sendRequestToTutor);

// Tutor request management routes
router.get('/tutor/requests', protect, tutorOnly, getTutorRequests);
router.put('/tutor/requests/:requestId/accept', protect, tutorOnly, acceptStudentRequest);
router.put('/tutor/requests/:requestId/decline', protect, tutorOnly, declineStudentRequest);


module.exports = router;
