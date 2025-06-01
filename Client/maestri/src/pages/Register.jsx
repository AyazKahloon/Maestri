import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMapMarkerAlt,
  FaBook,
} from "react-icons/fa";
import "./Register.css";
const API_BASE_URL =
"http://localhost:5000/api";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "student";

  // Ensure userType is valid
  const validUserType = ["student", "tutor"].includes(userType)
    ? userType
    : "student";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    city: "",
    country: "",
    subject: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Clean phone number for consistent handling
  const cleanPhoneNumber = (phone) => phone.replace(/[\s\-\(\)]/g, "");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phoneNumber" ? cleanPhoneNumber(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber =
        "Please enter a valid phone number (e.g., +1234567890)";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Tutor specific validations
    if (validUserType === "tutor") {
      if (!formData.city.trim()) {
        newErrors.city = "City is required";
      }

      if (!formData.country.trim()) {
        newErrors.country = "Country is required";
      }

      if (!formData.subject) {
        newErrors.subject = "Subject is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // try {
    //   // Simulate API call
    //   await new Promise((resolve) => setTimeout(resolve, 2000));

    //   // Mock user data for localStorage (to align with StudentDashboard.jsx)
    //   const userData = {
    //     id: Math.random().toString(36).substr(2, 9),
    //     email: formData.email,
    //     firstName: formData.firstName,
    //     lastName: formData.lastName,
    //     phoneNumber: formData.phoneNumber,
    //     userType: validUserType,
    //     isAuthenticated: false, // Require login to authenticate
    //     ...(validUserType === "tutor" && {
    //       city: formData.city,
    //       country: formData.country,
    //       subject: formData.subject,
    //     }),
    //   };

    //   // Save to localStorage (mock backend)
    //   localStorage.setItem("user", JSON.stringify(userData));

    //   console.log("Registration data:", userData);

    try {
      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: validUserType,
        phoneNumber: formData.phoneNumber,
        location: {
          city: formData.city || "",
          country: formData.country || "",
        },
      };

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Registration successful:", data);

      // Navigate to login
      navigate("/login", {
        state: {
          userType: validUserType,
          message: `${
            validUserType === "tutor" ? "Tutor" : "Student"
          } registration successful! Please login.`,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleLoginRedirect = () => {
    navigate("/login", { state: { userType: validUserType } });
  };

  // Subject options aligned with StudentDashboard.jsx
  const subjectOptions = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "English",
    "History",
    "Economics",
    "Spanish",
    "French",
    "Other",
  ];

  return (
    <div className="register-page">
      {/* Background */}
      <div className="register-background">
        <div className="background-overlay"></div>
      </div>

      {/* Content */}
      <div className="register-content">
        {/* Back Button */}
        <button
          className="back-button"
          onClick={handleBackToHome}
          aria-label="Back to Home"
        >
          <FaArrowLeft />
          <span>Back to Home</span>
        </button>

        {/* Registration Form */}
        <div className="register-container">
          <div className="register-header">
            <div className="header-icon">
              {validUserType === "tutor" ? (
                <FaChalkboardTeacher className="user-icon tutor-color" />
              ) : (
                <FaUserGraduate className="user-icon student-color" />
              )}
            </div>
            <h1 className="register-title">
              Welcome to {validUserType === "tutor" ? "Tutor" : "Student"}{" "}
              Registration
            </h1>
            <p className="register-subtitle">
              {validUserType === "tutor"
                ? "Join our community of expert tutors and start sharing your knowledge"
                : "Create your account to connect with amazing tutors and enhance your learning"}
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            {/* Name Fields Row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  <FaUser className="label-icon" />
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.firstName ? "error" : ""}`}
                  placeholder="Enter your first name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                />
                {errors.firstName && (
                  <span id="firstName-error" className="error-message">
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  <FaUser className="label-icon" />
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.lastName ? "error" : ""}`}
                  placeholder="Enter your last name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "lastName-error" : undefined
                  }
                />
                {errors.lastName && (
                  <span id="lastName-error" className="error-message">
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

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
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className="error-message">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Tutor Specific Fields */}
            {validUserType === "tutor" && (
              <>
                {/* Location Fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      <FaMapMarkerAlt className="label-icon" />
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`form-input ${errors.city ? "error" : ""}`}
                      placeholder="Enter your city"
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? "city-error" : undefined}
                    />
                    {errors.city && (
                      <span id="city-error" className="error-message">
                        {errors.city}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="country" className="form-label">
                      <FaMapMarkerAlt className="label-icon" />
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`form-input ${errors.country ? "error" : ""}`}
                      placeholder="Enter your country"
                      aria-invalid={!!errors.country}
                      aria-describedby={
                        errors.country ? "country-error" : undefined
                      }
                    />
                    {errors.country && (
                      <span id="country-error" className="error-message">
                        {errors.country}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Field */}
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    <FaBook className="label-icon" />
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`form-input ${errors.subject ? "error" : ""}`}
                    aria-invalid={!!errors.subject}
                    aria-describedby={
                      errors.subject ? "subject-error" : undefined
                    }
                  >
                    <option value="">Select your subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <span id="subject-error" className="error-message">
                      {errors.subject}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                <FaPhone className="label-icon" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`form-input ${errors.phoneNumber ? "error" : ""}`}
                placeholder="Enter your phone number (e.g., +1234567890)"
                aria-invalid={!!errors.phoneNumber}
                aria-describedby={
                  errors.phoneNumber ? "phoneNumber-error" : undefined
                }
              />
              {errors.phoneNumber && (
                <span id="phoneNumber-error" className="error-message">
                  {errors.phoneNumber}
                </span>
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
                  placeholder="Create a password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="error-message">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <FaLock className="label-icon" />
                Confirm Password
              </label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="confirmPassword-error" className="error-message">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="submit-error" role="alert">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating Account...
                </>
              ) : (
                `Create ${
                  validUserType === "tutor" ? "Tutor" : "Student"
                } Account`
              )}
            </button>

            {/* Login Link */}
            <div className="login-link">
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleLoginRedirect}
                  className="link-button"
                  aria-label={`Login as a ${validUserType}`}
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
