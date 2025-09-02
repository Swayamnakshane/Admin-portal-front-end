// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import api from '../api/api';
// import * as yup from 'yup';
// import './AuthPage.css';

// const loginSchema = yup.object().shape({
//   email: yup.string()
//     .email('Invalid email format')
//     .required('Email is required'),
//   password: yup.string()
//     .required('Password is required')
//     .min(8, 'Password must be at least 8 characters')
// });

// export const Login = () => {
//   const navigate = useNavigate();
//   const [credentials, setCredentials] = useState({
//     email: '',
//     password: ''
//   });
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);

//   useEffect(() => {
//     // Check if user is already logged in
//     if (document.cookie.includes('access_token')) {
//       navigate('/dashboard');
//     }
    
//     // Load remembered email if exists
//     const rememberedEmail = localStorage.getItem('rememberedEmail');
//     if (rememberedEmail) {
//       setCredentials(prev => ({ ...prev, email: rememberedEmail }));
//       setRememberMe(true);
//     }
//   }, [navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setCredentials(prev => ({ ...prev, [name]: value }));
    
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       await loginSchema.validate(credentials, { abortEarly: false });
      
//       setLoading(true);
      
//       const response = await api.post('/admin/adminlogin', credentials);
      
//       // Handle remember me
//       if (rememberMe) {
//         localStorage.setItem('rememberedEmail', credentials.email);
//       } else {
//         localStorage.removeItem('rememberedEmail');
//       }
      
//       // Set tokens as HTTP-only cookies
//       const maxAgeAccess = 86400; // 1 day
//       const maxAgeRefresh = 604800; // 7 days
      
//       document.cookie = `access_token=${response.data.access_token}; Secure; SameSite=Strict; path=/; max-age=${maxAgeAccess}`;
//       document.cookie = `refresh_token=${response.data.refresh_token}; Secure; SameSite=Strict; path=/; max-age=${maxAgeRefresh}`;
      
//       toast.success('🎉 Login successful! Redirecting...', {
//         icon: '✅'
//       });
      
//       setTimeout(() => navigate('/dashboard'), 1500);
//     } catch (error) {
//       let errorMessage = 'Login failed';
      
//       if (error.inner) {
//         const newErrors = {};
//         error.inner.forEach(err => {
//           newErrors[err.path] = err.message;
//         });
//         setErrors(newErrors);
//       } else {
//         if (error.response) {
//           errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
//         } else if (error.request) {
//           errorMessage = 'Network error. Please check your connection.';
//         }
        
//         toast.error(`❌ ${errorMessage}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <div className="auth-image-container">
//           <img 
//             src="https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230"
//             alt="Company Logo"
//             className="auth-logo"
//           />
//           <div className="auth-image-text">
//             <h3 className="auth-image-title">Welcome Back to Arcap</h3>
//             <p className="auth-image-subtitle">Sign in to access your admin dashboard</p>
//           </div>
//         </div>
        
//         <div className="auth-content">
//           <div className="text-center mb-4">
//             <h2 className="auth-title">Admin Login</h2>
//             <div className="auth-divider"></div>
//           </div>
          
//           <form onSubmit={handleSubmit}>
//             <div className="mb-4">
//               <label className="form-label">Email Address</label>
//               <input
//                 type="email"
//                 className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
//                 name="email"
//                 value={credentials.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email"
//               />
//               {errors.email && <div className="invalid-feedback">{errors.email}</div>}
//             </div>
            
//             <div className="mb-4">
//               <label className="form-label">Password</label>
//               <div className="input-group">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   className={`auth-input ${errors.password ? 'is-invalid' : ''}`}
//                   name="password"
//                   value={credentials.password}
//                   onChange={handleChange}
//                   placeholder="Enter your password"
//                 />
//                 <button 
//                   className="password-toggle-btn" 
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
//                 </button>
//               </div>
//               {errors.password && <div className="invalid-feedback">{errors.password}</div>}
//             </div>
            
//             <div className="d-flex justify-content-between align-items-center mb-4">
//               <div className="form-check">
//                 <input
//                   type="checkbox"
//                   className="form-check-input"
//                   id="rememberMe"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                 />
//                 <label className="form-check-label" htmlFor="rememberMe">
//                   Remember me
//                 </label>
//               </div>
//               <span className="auth-link">Forgot Password?</span>
//             </div>
            
//             <button 
//               type="submit" 
//               className="auth-btn w-100"
//               disabled={loading}
//             >
//               {loading ? (
//                 <span>
//                   <span className="spinner-border spinner-border-sm" role="status"></span>
//                   Logging In...
//                 </span>
//               ) : (
//                 <span>Login to Dashboard <i className="bi bi-box-arrow-in-right ms-2"></i></span>
//               )}
//             </button>
            
//             <div className="auth-link-text">
//               Don't have an account? <span className="auth-link" onClick={() => navigate('/register')}>Register</span>
//             </div>
//           </form>
//           <ToastContainer 
//             position="top-right"
//             theme="colored"
//             autoClose={3000}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// Login.js (updated)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/api';
import * as yup from 'yup';
import './AuthPage.css';

const loginSchema = yup.object().shape({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required')
});

export const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const accessToken = document.cookie.split('; ').find(row => row.startsWith('access_token'));
    if (accessToken) {
      navigate('/dashboard');
    }
    
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setCredentials(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      await loginSchema.validate(credentials, { abortEarly: false });
      setLoading(true);
      
      const response = await api.post('/admin/adminlogin', credentials);
      
      // Store admin details
      localStorage.setItem('admin_id', response.data.admin_id);
      localStorage.setItem('name', response.data.name);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', credentials.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Set token expiration (1 day for access, 7 days for refresh)
      const accessTokenExp = new Date(Date.now() + 86400000).toUTCString();
      const refreshTokenExp = new Date(Date.now() + 604800000).toUTCString();
      
      document.cookie = `access_token=${response.data.access_token}; expires=${accessTokenExp}; path=/;`;
      document.cookie = `refresh_token=${response.data.refresh_token}; expires=${refreshTokenExp}; path=/;`;
      
      toast.success('🎉 Login successful! Redirecting...', { 
        icon: '✅',
        autoClose: 1500,
        hideProgressBar: true
      });
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials';
      
      if (error.inner) {
        const newErrors = {};
        error.inner.forEach(err => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'Invalid email or password';
          } else {
            errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
          }
        } else if (error.request) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        toast.error(`❌ ${errorMessage}`, {
          autoClose: 5000,
          hideProgressBar: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-image-container bg-primary">
          <div className="auth-image-content">
            <h3 className="auth-image-title">Welcome Back</h3>
            <p className="auth-image-subtitle">Sign in to access your dashboard</p>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="text-center mb-4">
            <h2 className="auth-title">Admin Login</h2>
            <p className="text-muted">Enter your credentials to continue</p>
            <div className="auth-divider"></div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'is-invalid' : ''}`}
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="username"
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
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button 
                  className="password-toggle-btn" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <span className="auth-link">Forgot Password?</span>
            </div>
            
            <button 
              type="submit" 
              className="auth-btn w-100"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Authenticating...
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
            
            <div className="auth-footer mt-4 text-center">
              <p className="text-muted mb-0">Don't have an account?</p>
              <button 
                type="button" 
                className="btn btn-link p-0"
                onClick={() => navigate('/register')}
              >
                Create Admin Account
              </button>
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