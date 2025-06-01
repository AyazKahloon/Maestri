const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Tutor = require("../models/Tutor");

// Generate JWT Token
const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Register User
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      userType,
      phoneNumber,
      location,
    } = req.body;

    // Validate userType
    if (!userType || (userType !== "student" && userType !== "tutor")) {
      return res.status(400).json({
        success: false,
        message: "Valid userType (student or tutor) is required",
      });
    }

    let existingUser;
    let user;

    if (userType === "student") {
      // Check if student already exists
      existingUser = await Student.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Student already exists with this email",
        });
      }

      // Create student
      user = await Student.create({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        location,
      });
    } else {
      // Check if tutor already exists
      existingUser = await Tutor.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Tutor already exists with this email",
        });
      }

      // Create tutor
      user = await Tutor.create({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        location,
        bio: "",
        experience: 0,
        subjects: [],
      });
    }

    // Generate token
    const token = generateToken(user._id, userType);

    res.status(201).json({
      success: true,
      message: `${
        userType.charAt(0).toUpperCase() + userType.slice(1)
      } registered successfully`,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: userType,
        phoneNumber: user.phoneNumber,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and userType",
      });
    }

    // Validate userType
    if (userType !== "student" && userType !== "tutor") {
      return res.status(400).json({
        success: false,
        message: "Valid userType (student or tutor) is required",
      });
    }

    let user;

    // Check if user exists based on userType
    if (userType === "student") {
      user = await Student.findOne({ email }).select("+password");
    } else {
      user = await Tutor.findOne({ email }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id, userType);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: userType,
        phoneNumber: user.phoneNumber,
        location: user.location,
        ...(userType === "tutor" && {
          bio: user.bio,
          experience: user.experience,
          subjects: user.subjects,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          isVerified: user.isVerified,
          isAvailable: user.isAvailable,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Current User
const getMe = async (req, res) => {
  try {
    let user;

    if (req.user.userType === "student") {
      user = await Student.findById(req.user.id).populate(
        "tutorsAdded.tutor",
        "firstName lastName email location subjects"
      );
    } else {
      user = await Tutor.findById(req.user.id).populate(
        "subjects.subject",
        "name category"
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: req.user.userType,
        phoneNumber: user.phoneNumber,
        location: user.location,
        profilePicture: user.profilePicture,
        ...(req.user.userType === "tutor" && {
          bio: user.bio,
          experience: user.experience,
          education: user.education,
          subjects: user.subjects,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          isVerified: user.isVerified,
          isAvailable: user.isAvailable,
        }),
        ...(req.user.userType === "student" && {
          tutorsAdded: user.tutorsAdded,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, location, profilePicture } =
      req.body;

    let user;
    const updateData = {
      firstName,
      lastName,
      phoneNumber,
      location,
      profilePicture,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (req.user.userType === "student") {
      user = await Student.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      // For tutors, also allow updating tutor-specific fields
      const { bio, experience, education, isAvailable } = req.body;

      if (bio !== undefined) updateData.bio = bio;
      if (experience !== undefined) updateData.experience = experience;
      if (education !== undefined) updateData.education = education;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

      user = await Tutor.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true,
      }).populate("subjects.subject", "name category");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: req.user.userType,
        phoneNumber: user.phoneNumber,
        location: user.location,
        profilePicture: user.profilePicture,
        ...(req.user.userType === "tutor" && {
          bio: user.bio,
          experience: user.experience,
          education: user.education,
          subjects: user.subjects,
          averageRating: user.averageRating,
          totalReviews: user.totalReviews,
          isVerified: user.isVerified,
          isAvailable: user.isAvailable,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    let user;

    // Get user with password based on userType
    if (req.user.userType === "student") {
      user = await Student.findById(req.user.id).select("+password");
    } else {
      user = await Tutor.findById(req.user.id).select("+password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add Subject (Tutor only)
const addSubject = async (req, res) => {
  try {
    if (req.user.userType !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can add subjects",
      });
    }

    const { subject, hourlyRate, level } = req.body;

    if (!subject || !hourlyRate || !level) {
      return res.status(400).json({
        success: false,
        message: "Subject, hourly rate, and level are required",
      });
    }

    const tutor = await Tutor.findById(req.user.id);

    // Check if subject already exists for this tutor
    const existingSubject = tutor.subjects.find(
      (s) => s.subject.toString() === subject
    );
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject already added",
      });
    }

    tutor.subjects.push({ subject, hourlyRate, level });
    await tutor.save();

    await tutor.populate("subjects.subject", "name category");

    res.status(200).json({
      success: true,
      message: "Subject added successfully",
      subjects: tutor.subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Remove Subject (Tutor only)
const removeSubject = async (req, res) => {
  try {
    if (req.user.userType !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can remove subjects",
      });
    }

    const { subjectId } = req.params;

    const tutor = await Tutor.findById(req.user.id);

    tutor.subjects = tutor.subjects.filter(
      (s) => s._id.toString() !== subjectId
    );
    await tutor.save();

    await tutor.populate("subjects.subject", "name category");

    res.status(200).json({
      success: true,
      message: "Subject removed successfully",
      subjects: tutor.subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// const getAvailableTutors = async (req, res) => {
//   try {
//     const { subject, location, minRating, maxPrice, page = 1, limit = 10 } = req.query;

//     let query = { isActive: true, isAvailable: true };

//     // Filter by subject if provided
//     if (subject) {
//       query['subjects.subject'] = subject;
//     }

//     // Filter by location if provided
//     if (location) {
//       query.$or = [
//         { 'location.city': { $regex: location, $options: 'i' } },
//         { 'location.country': { $regex: location, $options: 'i' } }
//       ];
//     }

//     // Filter by rating if provided
//     if (minRating) {
//       query.averageRating = { $gte: parseFloat(minRating) };
//     }

//     const tutors = await Tutor.find(query)
//       .populate('subjects.subject', 'name category')
//       .select('-password -requests -students')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ averageRating: -1, totalReviews: -1 });

//     // Filter by price if provided (done after query since it's in subjects array)
//     let filteredTutors = tutors;
//     if (maxPrice) {
//       filteredTutors = tutors.filter(tutor =>
//         tutor.subjects.some(sub => sub.hourlyRate <= parseFloat(maxPrice))
//       );
//     }

//     res.status(200).json({
//       success: true,
//       tutors: filteredTutors,
//       totalCount: filteredTutors.length
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// Get Available Tutors
const getAvailableTutors = async (req, res) => {
  try {
    const {
      subject,
      location,
      minRating,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let query = { isActive: true, isAvailable: true };

    // Filter by subject if provided
    if (subject) {
      query["subjects.subject"] = subject;
    }

    // Filter by location if provided
    if (location) {
      query.$or = [
        { "location.city": { $regex: location, $options: "i" } },
        { "location.country": { $regex: location, $options: "i" } },
      ];
    }

    // Filter by rating if provided
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    const tutors = await Tutor.find(query)
      .populate("subjects.subject", "name category") // This populates the subject details
      .select("-password -requests -students")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ averageRating: -1, totalReviews: -1 });

    // Filter by price if provided (done after query since it's in subjects array)
    let filteredTutors = tutors;
    if (maxPrice) {
      filteredTutors = tutors.filter((tutor) =>
        tutor.subjects.some((sub) => sub.hourlyRate <= parseFloat(maxPrice))
      );
    }

    console.log("Tutors found:", filteredTutors.length);
    console.log("Sample tutor subjects:", filteredTutors[0]?.subjects);

    res.status(200).json({
      success: true,
      tutors: filteredTutors,
      totalCount: filteredTutors.length,
    });
  } catch (error) {
    console.error("Get tutors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Send Request to Tutor (Student only)
// Send Request to Tutor (Student only)
const sendRequestToTutor = async (req, res) => {
  try {
    if (req.user.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can send requests to tutors'
      });
    }

    const { tutorId, message, preferredTime, sessionType, subjectId } = req.body;

    if (!tutorId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tutor ID and message are required'
      });
    }

    // Find the tutor
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Find the student
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if request already exists
    const existingRequest = student.requests.find(req => 
      (req.tutor._id || req.tutor).toString() === tutorId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Request already sent to this tutor'
      });
    }

    // Create request object
    const requestData = {
      student: req.user.id,
      subject: subjectId || null,
      message: message.trim(),
      preferredTime: preferredTime || '',
      sessionType: sessionType || 'video',
      status: 'pending'
    };

    // Add request to tutor's requests
    tutor.requests.push(requestData);
    await tutor.save();

    // Add request to student's requests
    const studentRequestData = {
      tutor: tutorId,
      subject: subjectId || null,
      message: message.trim(),
      preferredTime: preferredTime || '',
      sessionType: sessionType || 'video',
      status: 'pending'
    };

    student.requests.push(studentRequestData);
    await student.save();

    res.status(201).json({
      success: true,
      message: 'Request sent successfully'
    });

  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



// Get Tutor Requests (Tutor only)
const getTutorRequests = async (req, res) => {
  try {
    if (req.user.userType !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can view requests",
      });
    }

    const tutor = await Tutor.findById(req.user.id)
      .populate({
        path: "requests.student",
        select: "firstName lastName email phoneNumber location",
      })
      .select("requests");

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    // Sort requests by most recent first
    const sortedRequests = tutor.requests.sort(
      (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
    );

    res.status(200).json({
      success: true,
      requests: sortedRequests,
    });
  } catch (error) {
    console.error("Get tutor requests error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Accept Student Request (Tutor only)
// Accept Student Request (Tutor only)
const acceptStudentRequest = async (req, res) => {
  try {
    if (req.user.userType !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can accept requests",
      });
    }

    const { requestId } = req.params;

    // Find the tutor and the specific request
    const tutor = await Tutor.findById(req.user.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    const request = tutor.requests.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    // Update request status to accepted
    request.status = "accepted";

    // Add student to tutor's students array if not already added
    const existingStudent = tutor.students.find(
      (s) => s.student.toString() === request.student.toString()
    );

    if (!existingStudent) {
      tutor.students.push({
        student: request.student,
        subject: request.subject || null,
        addedAt: new Date(),
      });
    }

    await tutor.save();

    // Update the corresponding request in student's requests array AND add tutor to student's tutorsAdded
    const student = await Student.findById(request.student);
    if (student) {
      const studentRequest = student.requests.find(
        (r) => r.tutor.toString() === req.user.id && r.status === "pending"
      );

      if (studentRequest) {
        studentRequest.status = "accepted";
      }

      // Add tutor to student's tutorsAdded array if not already added
      const existingTutor = student.tutorsAdded.find(
        (ta) => ta.tutor.toString() === req.user.id
      );

      if (!existingTutor) {
        student.tutorsAdded.push({
          tutor: req.user.id,
          subject: request.subject || null,
          addedAt: new Date(),
        });
      }

      await student.save();
    }

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Decline Student Request (Tutor only)
const declineStudentRequest = async (req, res) => {
  try {
    if (req.user.userType !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can decline requests",
      });
    }

    const { requestId } = req.params;

    // Find the tutor and the specific request
    const tutor = await Tutor.findById(req.user.id);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    const request = tutor.requests.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    // Update request status to declined
    request.status = "declined";
    await tutor.save();

    // Update the corresponding request in student's requests array
    const student = await Student.findById(request.student);
    if (student) {
      const studentRequest = student.requests.find(
        (r) => r.tutor.toString() === req.user.id && r.status === "pending"
      );

      if (studentRequest) {
        studentRequest.status = "declined";
        await student.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Request declined successfully",
    });
  } catch (error) {
    console.error("Decline request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  addSubject,
  removeSubject,
  getAvailableTutors,
  sendRequestToTutor,  // Add this line
  getTutorRequests,
  acceptStudentRequest,
  declineStudentRequest
};

