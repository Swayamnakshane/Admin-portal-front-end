import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/api';
import * as yup from 'yup';
import PasswordStrengthBar from 'react-password-strength-bar';
import './AuthPage.css';

// Enhanced validation schema
const registerSchema = yup.object().shape({
  name: yup.string()
    .required('Full name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required')
    .max(100, 'Email cannot exceed 100 characters'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  mobile: yup.string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Invalid mobile number (10 digits required)'),
 
});

// Error code mapping
const ERROR_MESSAGES = {
  EMAIL_EXISTS: 'This email is already registered',
 
  INVALID_ADMIN_ID: 'Admin ID format is invalid',
  MOBILE_EXISTS: 'Mobile number is already registered',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SERVER_ERROR: 'Server error. Please try again later',
  UNKNOWN_ERROR: 'An unexpected error occurred'
};

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    try {
      // Validate form data
      await registerSchema.validate(formData, { abortEarly: false });
      
      setLoading(true);
      
      // API call to register admin
      const response = await api.post('/admin/register', formData);
      
      // Success handling
      toast.success('🎉 Registration successful! Redirecting to login...', {
        icon: '✅',
        autoClose: 2000,
        hideProgressBar: true
      });
      
      // Redirect to login after delay
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      handleRegistrationError(error);
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive error handling
  const handleRegistrationError = (error) => {
    // Validation errors
    if (error.inner) {
      const newErrors = {};
      error.inner.forEach(err => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
      return;
    }
    
    // API response errors
    const response = error.response;
    let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
    
    if (!response) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      const errorCode = response.data?.code;
      
      // Handle specific error codes
      switch (errorCode) {
        case 'EMAIL_EXISTS':
          errorMessage = ERROR_MESSAGES.EMAIL_EXISTS;
          setErrors(prev => ({ ...prev, email: ERROR_MESSAGES.EMAIL_EXISTS }));
          
          break;
        case 'MOBILE_EXISTS':
          errorMessage = ERROR_MESSAGES.MOBILE_EXISTS;
          setErrors(prev => ({ ...prev, mobile: ERROR_MESSAGES.MOBILE_EXISTS }));
          break;
        case 'INVALID_ADMIN_ID':
          errorMessage = ERROR_MESSAGES.INVALID_ADMIN_ID;
          setErrors(prev => ({ ...prev, admin_id: ERROR_MESSAGES.INVALID_ADMIN_ID }));
          break;
        case 'SERVER_ERROR':
          errorMessage = ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          errorMessage = response.data?.message || errorMessage;
      }
    }
    
    // Show error notification
    toast.error(`❌ ${errorMessage}`, {
      autoClose: 5000,
      hideProgressBar: false
    });
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
    is_active: true
    });
    setErrors({});
    setSubmitAttempted(false);
  };

  // Check if form has errors
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-image-container">
          <img 
            src="https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230" 
            alt="Company Logo"
            className="auth-logo"
          />
          <div className="auth-image-text">
            <h3 className="auth-image-title">Welcome to Arcap</h3>
            <p className="auth-image-subtitle">Create your admin account to get started</p>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="text-center mb-4">
            <h2 className="auth-title">Create Admin Account</h2>
            <div className="auth-divider"></div>
          </div>
          
          {/* Form status indicators */}
          {submitAttempted && hasErrors && (
            <div className="alert alert-danger" role="alert">
              Please fix the errors in the form
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`auth-input ${errors.name ? 'is-invalid' : ''}`}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${errors.password ? 'is-invalid' : ''}`}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  disabled={loading}
                />
                <button 
                  className="password-toggle-btn" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              <PasswordStrengthBar 
                password={formData.password} 
                className="password-strength"
                minLength={8}
                scoreWords={['Too Weak', 'Weak', 'Fair', 'Good', 'Strong']}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className={`auth-input ${errors.mobile ? 'is-invalid' : ''}`}
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit number"
                disabled={loading}
              />
              {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
            </div>
          
            
            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                id="activeCheck"
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="activeCheck">
                Activate account immediately
              </label>
            </div>
            
            <div className="d-flex gap-2">
              <button 
                type="button"
                className="auth-btn w-50 bg-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </button>
              
              <button 
                type="submit" 
                className="auth-btn w-50"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Creating Account...
                  </span>
                ) : (
                  <span>Register Now <i className="bi bi-arrow-right ms-2"></i></span>
                )}
              </button>
            </div>
            
            <div className="auth-link-text mt-3">
              Already have an account? <span 
                className="auth-link" 
                onClick={() => !loading && navigate('/login')}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                Sign In
              </span>
            </div>
          </form>
          <ToastContainer 
            position="top-right"
            theme="colored"
            autoClose={3000}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </div>
    </div>
  );
};