import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
  FaComments,
  FaStar,
  FaSignOutAlt,
  FaBell,
  FaUser,
  FaClock,
  FaVideo,
  FaChartLine,
  FaBookOpen,
  FaEdit,
  FaCheck,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import { logout } from "../redux/slices/authSlice";
import "./TutorDashboard.css";
import Message from "./Message";
import axios from 'axios';

const API_BASE_URL = "https://maestri.onrender.com";

const TutorDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);

  const [loading, setLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);

  const [studentRequests, setStudentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    console.log("TutorDashboard - Auth state:", {
      isAuthenticated,
      user: user?.userType,
    });

    // Check if user is authenticated and is a tutor
    if (!isAuthenticated || !user) {
      console.log("Not authenticated, redirecting to login");
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } else if (user.userType !== "tutor") {
      console.log("Not a tutor, redirecting to login");
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } else {
      console.log("Tutor authenticated successfully");
      setLoading(false);
    }
  }, []);

  // Separate useEffect to handle auth state changes
  useEffect(() => {
    if (isAuthenticated && user && user.userType === "tutor") {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch student requests
 // Fetch student requests
useEffect(() => {
  const fetchStudentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/auth/tutor/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        console.log("Fetched requests:", response.data.requests);
        setStudentRequests(response.data.requests);
      } else {
        console.error("Failed to fetch requests:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching requests:", error.response?.data?.message || error.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  if (isAuthenticated && user && user.userType === "tutor") {
    fetchStudentRequests();
  }
}, [isAuthenticated, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleShowMessages = () => {
    setShowMessages(true);
  };

  const handleCloseMessages = () => {
    setShowMessages(false);
  };

  const handleAcceptRequest = async (requestId) => {
  try {
    setProcessingRequest(requestId);
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${API_BASE_URL}/auth/tutor/requests/${requestId}/accept`,
      {}, // Empty body for PUT request
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      // Update the request status in local state
      setStudentRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "accepted" } : req
        )
      );
      alert("Request accepted successfully!");
    } else {
      alert(response.data.message || "Failed to accept request");
    }
  } catch (error) {
    console.error("Error accepting request:", error.response?.data?.message || error.message);
    alert(error.response?.data?.message || "Failed to accept request. Please try again.");
  } finally {
    setProcessingRequest(null);
  }
};

  const handleDeclineRequest = async (requestId) => {
  try {
    setProcessingRequest(requestId);
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${API_BASE_URL}/auth/tutor/requests/${requestId}/decline`,
      {}, // Empty body for PUT request
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      // Update the request status in local state
      setStudentRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "declined" } : req
        )
      );
      alert("Request declined successfully!");
    } else {
      alert(response.data.message || "Failed to decline request");
    }
  } catch (error) {
    console.error("Error declining request:", error.response?.data?.message || error.message);
    alert(error.response?.data?.message || "Failed to decline request. Please try again.");
  } finally {
    setProcessingRequest(null);
  }
};


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
    return null;
  }

  // Mock data
  const upcomingSessions = [
    {
      id: 1,
      student: "Alice Johnson",
      subject: "Mathematics",
      topic: "Calculus - Derivatives",
      time: "2:00 PM - 3:00 PM",
      date: "Today",
      type: "Video Call",
    },
    {
      id: 2,
      student: "Bob Smith",
      subject: "Physics",
      topic: "Quantum Mechanics",
      time: "4:00 PM - 5:00 PM",
      date: "Tomorrow",
      type: "Chat Session",
    },
  ];

  const recentSessions = [
    {
      id: 1,
      student: "Sarah Davis",
      subject: "Mathematics",
      date: "Yesterday",
      duration: "1 hour",
      rating: 5,
      feedback: "Excellent explanation of complex numbers!",
    },
    {
      id: 2,
      student: "Mike Johnson",
      subject: "Physics",
      date: "2 days ago",
      duration: "45 minutes",
      rating: 4,
      feedback: "Very helpful session on wave mechanics.",
    },
  ];

  const stats = {
    totalStudents: 45,
    totalSessions: 128,
    averageRating: 4.9,
    monthlyEarnings: 2450,
  };

  const monthlyStats = {
    sessionsThisMonth: 24,
    newStudents: 8,
    earnings: 1200,
    hoursTeaching: 36,
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <FaChalkboardTeacher className="logo-icon" />
          <h1>Tutor Dashboard</h1>
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
            <span className="notification-badge">5</span>
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
          <p>Ready to inspire and teach your students today?</p>
        </section>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-info">
                <h3>{stats.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaBookOpen />
              </div>
              <div className="stat-info">
                <h3>{stats.totalSessions}</h3>
                <p>Total Sessions</p>
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
                <FaDollarSign />
              </div>
              <div className="stat-info">
                <h3>${stats.monthlyEarnings}</h3>
                <p>Monthly Earnings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Stats */}
        <section className="monthly-stats">
          <h3>This Month's Performance</h3>
          <div className="monthly-grid">
            <div className="monthly-card">
              <FaCalendarAlt className="monthly-icon" />
              <div className="monthly-info">
                <h4>{monthlyStats.sessionsThisMonth}</h4>
                <p>Sessions Completed</p>
              </div>
            </div>
            <div className="monthly-card">
              <FaUsers className="monthly-icon" />
              <div className="monthly-info">
                <h4>{monthlyStats.newStudents}</h4>
                <p>New Students</p>
              </div>
            </div>
            <div className="monthly-card">
              <FaDollarSign className="monthly-icon" />
              <div className="monthly-info">
                <h4>${monthlyStats.earnings}</h4>
                <p>Earnings</p>
              </div>
            </div>
            <div className="monthly-card">
              <FaClock className="monthly-icon" />
              <div className="monthly-info">
                <h4>{monthlyStats.hoursTeaching}</h4>
                <p>Hours Teaching</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-cards">
            <div className="action-card">
              <FaCalendarAlt className="action-icon" />
              <h4>Schedule Session</h4>
              <p>Set up a new tutoring session</p>
              <button className="action-btn">Schedule Now</button>
            </div>
            <div className="action-card">
              <FaComments className="action-icon" />
              <h4>Messages</h4>
              <p>Chat with your students</p>
              <button className="action-btn" onClick={handleShowMessages}>
                View Messages
                {unreadCount > 0 && (
                  <span className="message-count-badge">{unreadCount}</span>
                )}
              </button>
            </div>
            <div className="action-card">
              <FaEdit className="action-icon" />
              <h4>Update Profile</h4>
              <p>Edit your tutor profile</p>
              <button className="action-btn">Edit Profile</button>
            </div>
            <div className="action-card">
              <FaChartLine className="action-icon" />
              <h4>Analytics</h4>
              <p>View your performance metrics</p>
              <button className="action-btn">View Analytics</button>
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
                    <p className="student-name">with {session.student}</p>
                    <p className="session-topic">{session.topic}</p>
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
                    <button className="start-btn">Start Session</button>
                    <button className="reschedule-btn">Reschedule</button>
                  </div>
                </div>
              ))}
              {upcomingSessions.length === 0 && (
                <p className="no-sessions">No upcoming sessions scheduled.</p>
              )}
            </div>
          </section>

          {/* Student Requests */}
          {/* Student Requests */}
          <section className="dashboard-section">
            <h3>Student Requests</h3>
            <div className="requests-list">
              {loadingRequests ? (
                <div className="requests-loading">Loading requests...</div>
              ) : studentRequests.length > 0 ? (
                studentRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <div className="request-info">
                      <h4>
                        {request.student?.firstName} {request.student?.lastName}
                      </h4>
                      <p className="request-email">{request.student?.email}</p>
                      <p className="request-time">
                        <FaClock /> Preferred:{" "}
                        {request.preferredTime || "Not specified"}
                      </p>
                      <p className="request-session-type">
                        <FaVideo /> Session Type: {request.sessionType}
                      </p>
                      <p className="request-message">"{request.message}"</p>
                      <small className="request-timestamp">
                        Received:{" "}
                        {new Date(request.receivedAt).toLocaleDateString()} at{" "}
                        {new Date(request.receivedAt).toLocaleTimeString()}
                      </small>
                      <div className={`request-status ${request.status}`}>
                        Status:{" "}
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </div>
                    </div>
                    <div className="request-actions">
                      {request.status === "pending" ? (
                        <>
                          <button
                            className="accept-btn"
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={processingRequest === request._id}
                          >
                            <FaCheck />{" "}
                            {processingRequest === request._id
                              ? "Processing..."
                              : "Accept"}
                          </button>
                          <button
                            className="decline-btn"
                            onClick={() => handleDeclineRequest(request._id)}
                            disabled={processingRequest === request._id}
                          >
                            <FaTimes />{" "}
                            {processingRequest === request._id
                              ? "Processing..."
                              : "Decline"}
                          </button>
                        </>
                      ) : (
                        <span className={`status-badge ${request.status}`}>
                          {request.status === "accepted"
                            ? "Accepted"
                            : "Declined"}
                        </span>
                      )}
                      <button className="view-btn">
                        <FaEye /> View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-requests">
                  No student requests at the moment.
                </p>
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
                <p className="student-name">with {session.student}</p>
                <p className="session-duration">Duration: {session.duration}</p>
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
                  <button className="rebook-btn">Schedule Again</button>
                  <button className="contact-btn" onClick={handleShowMessages}>
                    Contact Student
                  </button>
                </div>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <p className="no-sessions">No recent sessions available.</p>
            )}
          </div>
        </section>
      </main>

      {/* Message Component Modal */}
      {showMessages && (
        <div className="message-modal-overlay">
          <Message onClose={handleCloseMessages} />
        </div>
      )}
    </div>
  );
};

export default TutorDashboard;
