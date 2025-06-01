import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaUserGraduate,
  FaChalkboardTeacher,
} from "react-icons/fa";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
} from "../redux/slices/authSlice";
import "./Login.css";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [userType, setUserType] = useState(
    location.state?.userType || "student"
  );
  const successMessage = location.state?.message || "";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Hardcoded credentials
  const hardcodedCredentials = {
    student: {
      email: "student@test.com",
      password: "student123",
    },
    tutor: {
      email: "tutor@test.com",
      password: "tutor123",
    },
  };

  // Update userType when location state changes
  useEffect(() => {
    if (location.state?.userType) {
      setUserType(location.state.userType);
    }
  }, [location.state]);

  // Handle success message
  useEffect(() => {
    if (successMessage) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setErrors({ submit: error });
    } else {
      setErrors((prev) => ({ ...prev, submit: "" }));
    }
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   if (!validateForm()) {
  //     console.log('Form validation failed:', errors);
  //     return;
  //   }

  //   // Start loading
  //   dispatch(loginStart());

  //   // Get credentials for current user type
  //   const credentials = hardcodedCredentials[userType];

  //   console.log('Login attempt:', { userType, email: formData.email });

  //   // Validate credentials
  //   if (formData.email === credentials.email && formData.password === credentials.password) {
  //     // Create user data based on type
  //     const userData = {
  //       id: userType === 'student' ? 'student_1' : 'tutor_1',
  //       email: formData.email,
  //       firstName: userType === 'student' ? 'John' : 'Dr. Sarah',
  //       lastName: userType === 'student' ? 'Doe' : 'Johnson',
  //       userType: userType,
  //       phoneNumber: userType === 'student' ? '+1234567890' : '+0987654321',
  //       location: {
  //         city: userType === 'student' ? 'New York' : 'Boston',
  //         country: 'USA'
  //       },
  //       profilePicture: null,
  //       isActive: true,
  //       isAuthenticated: true,
  //       ...(userType === 'tutor' && {
  //         subjects: ['Mathematics', 'Physics'],
  //         bio: 'Experienced mathematics and physics tutor with PhD in Applied Mathematics.',
  //         hourlyRate: 50,
  //         rating: 4.9,
  //         totalStudents: 45,
  //         experience: 10,
  //         education: 'PhD in Applied Mathematics from MIT',
  //         isVerified: true,
  //         isAvailable: true
  //       })
  //     };

  //     const token = `mock_token_${userType}_${Date.now()}`;

  //     console.log('Login successful for:', userData);

  //     // Store in localStorage
  //     try {
  //       localStorage.setItem('user', JSON.stringify(userData));
  //       localStorage.setItem('token', token);
  //       localStorage.setItem('userType', userType);
  //     } catch (error) {
  //       console.error('Error saving to localStorage:', error);
  //       dispatch(loginFailure('Failed to save authentication data.'));
  //       return;
  //     }

  //     // Dispatch success action
  //     dispatch(loginSuccess({
  //       user: userData,
  //       token: token
  //     }));

  //     // Navigate to appropriate dashboard
  //     const targetRoute = userType === 'tutor' ? '/tutor-dashboard' : '/student-dashboard';
  //     console.log('Navigating to:', targetRoute);
  //     navigate(targetRoute, { replace: true });
  //   } else {
  //     console.log('Invalid credentials');
  //     dispatch(loginFailure('Invalid email or password. Please try again.'));
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    // Start loading
    dispatch(loginStart());

    try {
      // Prepare login data
      const loginData = {
        email: formData.email,
        password: formData.password,
        userType: userType,
      };

      console.log("Login attempt:", { userType, email: formData.email });

      // Call backend API
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        loginData
      );

      const { data } = response;

      if (data.success) {
        const { user, token } = data;

        console.log("Login successful for:", user);

        // Store in localStorage
        try {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);
          localStorage.setItem("userType", user.userType);
        } catch (error) {
          console.error("Error saving to localStorage:", error);
          dispatch(loginFailure("Failed to save authentication data."));
          return;
        }

        // Dispatch success action
        dispatch(
          loginSuccess({
            user: user,
            token: token,
          })
        );

        // Navigate to appropriate dashboard
        const targetRoute =
          user.userType === "tutor" ? "/tutor-dashboard" : "/student-dashboard";
        console.log("Navigating to:", targetRoute);
        navigate(targetRoute, { replace: true });
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please try again.";

      if (error.response) {
        // Backend returned an error response
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection.";
      }

      dispatch(loginFailure(errorMessage));
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleRegisterRedirect = () => {
    navigate("/register", { state: { userType } });
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password", { state: { userType } });
  };

  const handleSwitchUserType = () => {
    const newUserType = userType === "student" ? "tutor" : "student";
    setFormData({ email: "", password: "" });
    setErrors({});
    dispatch(clearError());
    setUserType(newUserType);
    // Update URL state without navigation
    window.history.replaceState({ userType: newUserType }, "", "/login");
  };

  const handleTestLogin = () => {
    const credentials = hardcodedCredentials[userType];
    setFormData({
      email: credentials.email,
      password: credentials.password,
    });
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-background">
        <div className="background-overlay"></div>
      </div>

      {/* Content */}
      <div className="login-content">
        {/* Back Button */}
        <button className="back-button" onClick={handleBackToHome}>
          <FaArrowLeft />
          <span>Back to Home</span>
        </button>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            <div className="success-content">
              <span>{successMessage}</span>
              <button
                className="close-success"
                onClick={() => setShowSuccessMessage(false)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="login-container">
          <div className="login-header">
            <div className="header-icon">
              {userType === "tutor" ? (
                <FaChalkboardTeacher className="user-icon tutor-color" />
              ) : (
                <FaUserGraduate className="user-icon student-color" />
              )}
            </div>
            <h1 className="login-title">
              {userType === "tutor" ? "Tutor" : "Student"} Login
            </h1>
            <p className="login-subtitle">
              {userType === "tutor"
                ? "Welcome back! Sign in to access your tutor dashboard"
                : "Welcome back! Sign in to continue your learning journey"}
            </p>
          </div>

          {/* Test Credentials Info */}
          <div className="test-credentials">
            <p>
              <strong>Test Credentials for {userType}:</strong>
            </p>
            <p>Email: {hardcodedCredentials[userType].email}</p>
            <p>Password: {hardcodedCredentials[userType].password}</p>
            <button
              type="button"
              onClick={handleTestLogin}
              className="test-login-btn"
            >
              Fill Test Credentials
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FaEnvelope className="label-icon" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FaLock className="label-icon" />
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="link-button"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="submit-error">{errors.submit}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`submit-button ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Signing In...
                </>
              ) : (
                `Sign In as ${userType === "tutor" ? "Tutor" : "Student"}`
              )}
            </button>

            {/* Register Link */}
            <div className="register-link">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={handleRegisterRedirect}
                  className="link-button"
                  disabled={loading}
                >
                  Register here
                </button>
              </p>
            </div>

            {/* Switch User Type */}
            <div className="switch-user-type">
              <p>
                Looking to login as a{" "}
                {userType === "student" ? "tutor" : "student"}?{" "}
                <button
                  type="button"
                  onClick={handleSwitchUserType}
                  className="link-button"
                  disabled={loading}
                >
                  Switch to {userType === "student" ? "tutor" : "student"} login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
