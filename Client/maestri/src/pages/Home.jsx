import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaChalkboardTeacher, FaUserGraduate, FaBook } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleAuthAction = (userType, action) => {
    navigate(`/${action}`, { state: { userType } });
  };

  return (
    <div className="home-page">
      {/* Fixed Navbar */}
      <header className="top-navbar">
        <div className="navbar-container">
          <div className="brand">
            <FaBook className="brand-icon" />
            <span>Maestri</span>
          </div>
          <nav className="navigation">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* Content Area */}
      <div className="content-area">
        {/* Hero Content */}
        <div className="hero-wrapper">
          <div className="title-section">
            <h1>Welcome to Maestri</h1>
            <p>Connect students with expert tutors for personalized learning experiences</p>
          </div>

          {/* Auth Card */}
          <div className="auth-card">
            <div className="card-header">
              <h2>Get Started</h2>
              <p>Choose your role to continue</p>
            </div>
            
            <div className="user-options">
              {/* Student Side */}
              <div className="option-side">
                <div className="option-info">
                  <FaUserGraduate className="option-icon student-color" />
                  <h3>Student</h3>
                  <p>Find expert tutors and get help with your studies</p>
                </div>
                <div className="button-group">
                  <button 
                    className="primary-button"
                    onClick={() => handleAuthAction('student', 'login')}
                  >
                    Login as Student
                  </button>
                  <button 
                    className="secondary-button"
                    onClick={() => handleAuthAction('student', 'register')}
                  >
                    Register as Student
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="separator">
                <span>OR</span>
              </div>

              {/* Tutor Side */}
              <div className="option-side">
                <div className="option-info">
                  <FaChalkboardTeacher className="option-icon tutor-color" />
                  <h3>Tutor</h3>
                  <p>Share your expertise and help students succeed</p>
                </div>
                <div className="button-group">
                  <button 
                    className="primary-button"
                    onClick={() => handleAuthAction('tutor', 'login')}
                  >
                    Login as Tutor
                  </button>
                  <button 
                    className="secondary-button"
                    onClick={() => handleAuthAction('tutor', 'register')}
                  >
                    Register as Tutor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="features-wrapper">
          <div className="features-container">
            <h2>Why Choose Maestri?</h2>
            <div className="feature-cards">
              <div className="feature-item">
                <FaGraduationCap className="feature-icon" />
                <h3>Expert Tutors</h3>
                <p>Connect with qualified tutors in various subjects</p>
              </div>
              <div className="feature-item">
                <FaChalkboardTeacher className="feature-icon" />
                <h3>Personalized Learning</h3>
                <p>Get customized help tailored to your learning style</p>
              </div>
              <div className="feature-item">
                <FaBook className="feature-icon" />
                <h3>Real-time Chat</h3>
                <p>Instant messaging with tutors for quick help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
