import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUserGraduate,
  FaSearch,
  FaBook,
  FaCalendarAlt,
  FaComments,
  FaStar,
  FaSignOutAlt,
  FaBell,
  FaUser,
  FaClock,
  FaVideo,
  FaChartLine,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaTimes,
  FaPaperPlane,
  FaBookOpen,
} from "react-icons/fa";
import { logout, setUser } from '../redux/slices/authSlice';
import "./StudentDashboard.css";
import Message from "./Message";
import axios from "axios";

const API_BASE_URL = "https://maestri.onrender.com";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);

  // const [selectedTutor, setSelectedTutor] = useState(null);
  // const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableTutors, setAvailableTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  // const [searchFilters, setSearchFilters] = useState({
  //   subject: "",
  //   location: "",
  //   minRating: 0,
  //   maxPrice: 100,
  // });
  // const [searchResults, setSearchResults] = useState([]);
  // const [requestForm, setRequestForm] = useState({
  //   subject: "",
  //   message: "",
  //   preferredTime: "",
  //   sessionType: "video",
  // });
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    subject: "",
    location: "",
    minRating: 0,
    maxPrice: 100,
  });
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    subject: "",
    message: "",
    preferredTime: "",
    sessionType: "video",
  });

  useEffect(() => {
    console.log("StudentDashboard - Auth state:", {
      isAuthenticated,
      user: user?.userType,
    });

    // Check if user is authenticated and is a student
    if (!isAuthenticated || !user) {
      console.log("Not authenticated, redirecting to login");
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } else if (user.userType !== "student") {
      console.log("Not a student, redirecting to login");
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } else {
      console.log("Student authenticated successfully");
      setLoading(false);
    }
  }, []);

  // Separate useEffect to handle auth state changes
  useEffect(() => {
    if (isAuthenticated && user && user.userType === "student") {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

 
  // Fetch available tutors
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setTutorsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/auth/tutors`);

        if (response.data.success) {
          setAvailableTutors(response.data.tutors);
          setFilteredTutors(response.data.tutors);
        }
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setTutorsLoading(false);
      }
    };

    if (isAuthenticated && user && user.userType === "student") {
      fetchTutors();
    }
  }, [isAuthenticated, user]);

  // Filter tutors based on search criteria
  // Filter tutors based on search criteria and exclude already added tutors
useEffect(() => {
  let filtered = availableTutors;

  // First, exclude tutors that are already added by this student
  if (user && user.tutorsAdded && user.tutorsAdded.length > 0) {
    const addedTutorIds = user.tutorsAdded.map(ta => ta.tutor._id || ta.tutor);
    filtered = filtered.filter(tutor => !addedTutorIds.includes(tutor._id));
  }

  // Filter by name
  if (searchFilters.name) {
    filtered = filtered.filter((tutor) =>
      `${tutor.firstName} ${tutor.lastName}`
        .toLowerCase()
        .includes(searchFilters.name.toLowerCase())
    );
  }

  // Filter by subject
  if (searchFilters.subject) {
    filtered = filtered.filter((tutor) =>
      tutor.subjects.some((sub) =>
        sub.subject.name
          .toLowerCase()
          .includes(searchFilters.subject.toLowerCase())
      )
    );
  }

  // Filter by location
  if (searchFilters.location) {
    filtered = filtered.filter(
      (tutor) =>
        tutor.location?.city
          ?.toLowerCase()
          .includes(searchFilters.location.toLowerCase()) ||
        tutor.location?.country
          ?.toLowerCase()
          .includes(searchFilters.location.toLowerCase())
    );
  }

  // Filter by rating
  if (searchFilters.minRating > 0) {
    filtered = filtered.filter(
      (tutor) => tutor.averageRating >= searchFilters.minRating
    );
  }

  // Filter by price
  if (searchFilters.maxPrice < 100) {
    filtered = filtered.filter((tutor) =>
      tutor.subjects.some((sub) => sub.hourlyRate <= searchFilters.maxPrice)
    );
  }

  setFilteredTutors(filtered);
}, [availableTutors, searchFilters, user]);


  // Add body class management for modal
  useEffect(() => {
    if (showRequestModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showRequestModal]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleShowMessages = () => {
    console.log("Opening messages modal");
    setShowMessages(true);
  };

  const handleCloseMessages = () => {
    console.log("Closing messages modal");
    setShowMessages(false);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleSendRequest = (tutor) => {
  //   setSelectedTutor(tutor);
  //   setShowRequestModal(true);
  // };

  const handleSendRequest = (tutor) => {
    setSelectedTutor(tutor);
    // Pre-populate with tutor's first subject if available
    if (tutor.subjects && tutor.subjects.length > 0) {
      setRequestForm((prev) => ({
        ...prev,
        subject: tutor.subjects[0].subject._id,
      }));
    }
    setShowRequestModal(true);
  };

const handleRequestSubmit = async (e) => {
  e.preventDefault();
  
  if (!requestForm.message) {
    alert('Please fill in the message field');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
   const requestData = {
  tutorId: selectedTutor._id,  // Make sure this is _id, not id
  message: requestForm.message,
  preferredTime: requestForm.preferredTime,
  sessionType: requestForm.sessionType,
  subjectId: requestForm.subject || null
};


    console.log('Sending request data:', requestData);

    const response = await fetch(`${API_BASE_URL}/auth/send-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    if (data.success) {
      alert('Request sent successfully!');
      setShowRequestModal(false);
      setRequestForm({
        subject: '',
        message: '',
        preferredTime: '',
        sessionType: 'video'
      });
      setSelectedTutor(null);
      
      // Refresh user data to get updated tutorsAdded list
      // This will trigger the useEffect to re-filter available tutors
      await refreshUserData(); // Simple refresh, or implement proper state update
    } else {
      throw new Error(data.message || 'Failed to send request');
    }
  } catch (error) {
    console.error('Error sending request:', error);
    alert(error.message || 'Failed to send request. Please try again.');
  }
};

const refreshUserData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      // Update user data in Redux store
      dispatch(setUser(data.user));
      console.log('User data refreshed:', data.user);
    }
  } catch (error) {
    console.error('Error refreshing user data:', error);
  }
};


  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add loading check before render
  if (loading) {
    return (
      <div className="dashboard-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
          }}
        >
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  // Mock data for existing components
  const upcomingSessions = [
    {
      id: 1,
      tutor: "Dr. Sarah Johnson",
      subject: "Mathematics",
      time: "2:00 PM - 3:00 PM",
      date: "Today",
      type: "Video Call",
    },
    {
      id: 2,
      tutor: "Prof. Michael Chen",
      subject: "Physics",
      time: "4:00 PM - 5:00 PM",
      date: "Tomorrow",
      type: "Chat Session",
    },
  ];

  const recentSessions = [
    {
      id: 1,
      tutor: "Dr. Emily Davis",
      subject: "Chemistry",
      date: "Yesterday",
      rating: 5,
      feedback: "Excellent explanation of organic chemistry concepts!",
    },
    {
      id: 2,
      tutor: "Prof. James Wilson",
      subject: "Biology",
      date: "2 days ago",
      rating: 4,
      feedback: "Very helpful session on cell biology.",
    },
  ];

  // const availableTutors = [
  //   {
  //     id: 1,
  //     name: 'Dr. Lisa Anderson',
  //     subject: 'English Literature',
  //     rating: 4.9,
  //     price: '$25/hour',
  //     online: true
  //   },
  //   {
  //     id: 2,
  //     name: 'Prof. Robert Kim',
  //     subject: 'Computer Science',
  //     rating: 4.8,
  //     price: '$30/hour',
  //     online: true
  //   },
  //   {
  //     id: 3,
  //     name: 'Dr. Maria Garcia',
  //     subject: 'Spanish',
  //     rating: 4.7,
  //     price: '$20/hour',
  //     online: false
  //   }
  // ];

  const stats = {
    totalSessions: 24,
    hoursLearned: 48,
    averageRating: 4.8,
    completedCourses: 3,
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <FaUserGraduate className="logo-icon" />
          <h1>Student Dashboard</h1>
        </div>
        <div className="header-right">
          <button className="notification-btn" onClick={handleShowMessages}>
            <FaComments />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button className="notification-btn">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
          <div className="user-menu">
            <FaUser className="user-icon" />
            <span>
              {user.firstName} {user.lastName}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h2>Welcome back, {user.firstName}!</h2>
          <p>Ready to continue your learning journey?</p>
        </section>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaBook />
              </div>
              <div className="stat-info">
                <h3>{stats.totalSessions}</h3>
                <p>Total Sessions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaClock />
              </div>
              <div className="stat-info">
                <h3>{stats.hoursLearned}</h3>
                <p>Hours Learned</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaStar />
              </div>
              <div className="stat-info">
                <h3>{stats.averageRating}</h3>
                <p>Average Rating</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaGraduationCap />
              </div>
              <div className="stat-info">
                <h3>{stats.completedCourses}</h3>
                <p>Completed Courses</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-cards">
            <div className="action-card">
              <FaSearch className="action-icon" />
              <h4>Find a Tutor</h4>
              <p>Search for tutors in your subject</p>
              <button className="action-btn">Search Now</button>
            </div>
            <div className="action-card">
              <FaCalendarAlt className="action-icon" />
              <h4>Schedule Session</h4>
              <p>Book a session with your favorite tutor</p>
              <button className="action-btn">Schedule</button>
            </div>
            <div className="action-card">
              <FaComments className="action-icon" />
              <h4>Messages</h4>
              <p>Chat with your tutors</p>
              <button className="action-btn" onClick={handleShowMessages}>
                View Messages
                {unreadCount > 0 && (
                  <span className="message-count-badge">{unreadCount}</span>
                )}
              </button>
            </div>
            <div className="action-card">
              <FaChartLine className="action-icon" />
              <h4>Progress</h4>
              <p>Track your learning progress</p>
              <button className="action-btn">View Progress</button>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Upcoming Sessions */}
          <section className="dashboard-section">
            <h3>Upcoming Sessions</h3>
            <div className="sessions-list">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-info">
                    <h4>{session.subject}</h4>
                    <p className="tutor-name">with {session.tutor}</p>
                    <div className="session-details">
                      <span className="session-time">
                        <FaClock /> {session.time}
                      </span>
                      <span className="session-date">{session.date}</span>
                      <span className="session-type">
                        <FaVideo /> {session.type}
                      </span>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button className="join-btn">Join</button>
                    <button className="reschedule-btn">Reschedule</button>
                  </div>
                </div>
              ))}
              {upcomingSessions.length === 0 && (
                <p className="no-sessions">No upcoming sessions scheduled.</p>
              )}
            </div>
          </section>

          {/* Available Tutors */}
          <section className="dashboard-section">
            <h3>Available Tutors</h3>

            {/* Search Filters */}
            <div className="tutor-search-bar">
              <div className="form-group">
                <label>
                  <FaSearch className="label-icon" />
                  Search by Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={searchFilters.name}
                  onChange={handleSearchChange}
                  placeholder="Enter tutor name"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaBook className="label-icon" />
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={searchFilters.subject}
                  onChange={handleSearchChange}
                  placeholder="Enter subject"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaMapMarkerAlt className="label-icon" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={searchFilters.location}
                  onChange={handleSearchChange}
                  placeholder="Enter city or country"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaStar className="label-icon" />
                  Min Rating
                </label>
                <select
                  name="minRating"
                  value={searchFilters.minRating}
                  onChange={handleSearchChange}
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              <div className="form-group">
                <label>Max Price ($/hour)</label>
                <input
                  type="range"
                  name="maxPrice"
                  min="10"
                  max="100"
                  value={searchFilters.maxPrice}
                  onChange={handleSearchChange}
                />
                <span>${searchFilters.maxPrice}</span>
              </div>
            </div>

            <div className="tutors-list">
              {tutorsLoading ? (
                <p>Loading tutors...</p>
              ) : filteredTutors.length > 0 ? (
                filteredTutors.map((tutor) => (
                  <div key={tutor._id} className="tutor-card">
                    <div className="tutor-info">
                      <h4>
                        {tutor.firstName} {tutor.lastName}
                      </h4>
                      <p className="tutor-subject">
                        {tutor.subjects
                          .map((sub) => sub.subject.name)
                          .join(", ")}
                      </p>
                      <div className="tutor-details">
                        <span className="tutor-rating">
                          <FaStar /> {tutor.averageRating || 0}
                        </span>
                        <span className="tutor-price">
                          ${tutor.subjects[0]?.hourlyRate || 0}/hour
                        </span>
                        <span
                          className={`tutor-status ${
                            tutor.isAvailable ? "online" : "offline"
                          }`}
                        >
                          {tutor.isAvailable ? "Available" : "Busy"}
                        </span>
                      </div>
                      <p className="tutor-location">
                        <FaMapMarkerAlt /> {tutor.location?.city},{" "}
                        {tutor.location?.country}
                      </p>
                      {tutor.bio && (
                        <p className="tutor-bio">
                          {tutor.bio.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="tutor-actions">
                      <button
                        className="contact-btn"
                        onClick={handleShowMessages}
                      >
                        <FaComments /> Contact
                      </button>
                      <button
                        className="book-btn"
                        onClick={() => handleSendRequest(tutor)}
                      >
                        <FaPaperPlane /> Send Request
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No tutors found matching your criteria.</p>
              )}
            </div>
          </section>
        </div>

        {/* Recent Sessions */}
        <section className="dashboard-section">
          <h3>Recent Sessions</h3>
          <div className="recent-sessions">
            {recentSessions.map((session) => (
              <div key={session.id} className="recent-session-card">
                <div className="session-header">
                  <h4>{session.subject}</h4>
                  <span className="session-date">{session.date}</span>
                </div>
                <p className="tutor-name">with {session.tutor}</p>
                <div className="session-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={
                          i < session.rating ? "star-filled" : "star-empty"
                        }
                      />
                    ))}
                  </div>
                  <span className="rating-text">({session.rating}/5)</span>
                </div>
                <p className="session-feedback">"{session.feedback}"</p>
                <div className="session-actions">
                  <button className="rebook-btn">Book Again</button>
                  <button className="review-btn">Write Review</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Message Component Modal */}
      {/* Message Component Modal */}
      {showMessages && (
        <div className="message-modal-overlay">
          <Message onClose={handleCloseMessages} />
        </div>
      )}

      {/* Request Modal */}
      {/* Request Modal - Popup */}
      {/* Request Modal - Popup */}
      {showRequestModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRequestModal(false);
            }
          }}
        >
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Send Request to {selectedTutor?.firstName}{" "}
                {selectedTutor?.lastName}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowRequestModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="tutor-info-preview">
                <div className="tutor-avatar">
                  <FaUser />
                </div>
                <div className="tutor-details-preview">
                  <h4>
                    {selectedTutor?.firstName} {selectedTutor?.lastName}
                  </h4>
                  <p className="tutor-subjects">
                    Teaches:{" "}
                    {selectedTutor?.subjects
                      .map((sub) => sub.subject.name)
                      .join(", ")}
                  </p>
                  <p className="tutor-location-preview">
                    <FaMapMarkerAlt /> {selectedTutor?.location?.city},{" "}
                    {selectedTutor?.location?.country}
                  </p>
                </div>
              </div>

              <form onSubmit={handleRequestSubmit} className="request-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <FaVideo className="label-icon" />
                      Session Type
                    </label>
                    <select
                      name="sessionType"
                      value={requestForm.sessionType}
                      onChange={handleRequestFormChange}
                    >
                      <option value="video">Video Call</option>
                      <option value="chat">Chat Session</option>
                      <option value="in-person">In-Person</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <FaClock className="label-icon" />
                      Preferred Time
                    </label>
                    <input
                      type="text"
                      name="preferredTime"
                      value={requestForm.preferredTime}
                      onChange={handleRequestFormChange}
                      placeholder="e.g., Weekdays 6-8 PM"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FaComments className="label-icon" />
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={requestForm.message}
                    onChange={handleRequestFormChange}
                    placeholder="Describe what you need help with, your current level, specific topics, goals, etc..."
                    required
                    minLength={10}
                    rows={4}
                  />
                  <small className="form-hint">
                    Minimum 10 characters required
                  </small>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowRequestModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="send-request-btn">
                    <FaPaperPlane /> Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
