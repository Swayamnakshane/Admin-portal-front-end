import React, { useState, useEffect } from "react";
import api from "../api/api";

import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/employee/login", {
        email,
        password,
      });

      const { access_token, refresh_token, name, employee_id } = res.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("name", name);
      localStorage.setItem("employee_id", employee_id);

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      toast.success("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      
      // Clear password on failed login
      if (errorMessage.toLowerCase().includes("invalid credentials")) {
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  // Open external links in new tab
  const openExternalLink = (url) => {
    window.open(url, "_blank");
  };

  return (
    <div className="d-flex vh-100" style={{
      fontFamily: "'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: "hidden",
      background: "#f8fafc"
    }}>
      {/* Left Section - Professional Banner */}
      <div className="d-none d-lg-flex col-lg-7 position-relative" style={{
        background: "#ffffff",
        overflow: "hidden",
      }}>
        {/* Floating elements */}
        <div className="position-absolute" style={{
          top: "-100px",
          left: "-50px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25, 118, 210, 0.08) 0%, transparent 70%)"
        }}></div>
        
        <div className="position-absolute" style={{
          bottom: "-150px",
          right: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(33, 150, 243, 0.06) 0%, transparent 70%)"
        }}></div>
        
        {/* Geometric pattern */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(rgba(13, 110, 253, 0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.4
        }}></div>
        
        {/* Content */}
        <div className="position-relative z-2 d-flex flex-column justify-content-center h-100 p-5">
          <div className="text-center">
            <div className="mb-5">
              <img
                src="https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230"
                alt="Arcap Company Logo"
                style={{ 
                  height: "120px",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))"
                }}
              />
            </div>
            
            <h1 className="display-3 fw-bold mb-4" style={{ 
              lineHeight: 1.2,
              color: "#0d3b66",
              fontWeight: 700,
              letterSpacing: "-0.5px"
            }}>
              <span style={{ color: "#1a6fc4" }}>Arcap</span> Technologies
            </h1>
            
            <p className="fs-4 mb-5 px-4" style={{ 
              maxWidth: "800px", 
              margin: "0 auto", 
              color: "#1a6fc4",
              fontWeight: 400,
              lineHeight: 1.5
            }}>
              Enterprise solutions for the modern workforce. Secure, reliable, and designed for productivity.
            </p>
          </div>
          
          {/* Stats */}
          <div className="d-flex gap-5 justify-content-center mt-5">
            <div className="text-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ 
                width: "70px", 
                height: "70px", 
                background: "rgba(25, 118, 210, 0.1)",
                boxShadow: "0 4px 10px rgba(25, 118, 210, 0.15)"
              }}>
                <i className="bi bi-shield-check fs-2" style={{ color: "#0d47a1" }}></i>
              </div>
              <div className="fw-medium" style={{ color: "#0d3b66" }}>Enterprise Security</div>
            </div>
            
            <div className="text-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ 
                width: "70px", 
                height: "70px", 
                background: "rgba(25, 118, 210, 0.1)",
                boxShadow: "0 4px 10px rgba(25, 118, 210, 0.15)"
              }}>
                <i className="bi bi-people-fill fs-2" style={{ color: "#0d47a1" }}></i>
              </div>
              <div className="fw-medium" style={{ color: "#0d3b66" }}>Global Workforce</div>
            </div>
            
            <div className="text-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ 
                width: "70px", 
                height: "70px", 
                background: "rgba(25, 118, 210, 0.1)",
                boxShadow: "0 4px 10px rgba(25, 118, 210, 0.15)"
              }}>
                <i className="bi bi-award-fill fs-2" style={{ color: "#0d47a1" }}></i>
              </div>
              <div className="fw-medium" style={{ color: "#0d3b66" }}>Industry Leaders</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="col-12 col-lg-5 d-flex align-items-center justify-content-center p-4" style={{
        background: "#ffffff",
        position: "relative",
        overflow: "auto",
        boxShadow: "-5px 0 15px rgba(0, 0, 0, 0.05)"
      }}>
        <div className="w-100" style={{ maxWidth: "450px" }}>
          {/* Form Header */}
          <div className="text-center mb-5">
            <div className="d-flex justify-content-center mb-4">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                width: "80px", 
                height: "80px",
                background: "linear-gradient(135deg, #1a6fc4 0%, #0d47a1 100%)",
                boxShadow: "0 4px 10px rgba(13, 71, 161, 0.3)"
              }}>
                <i className="bi bi-person-badge-fill fs-1 text-white"></i>
              </div>
            </div>
            <h2 className="fw-bold mb-2" style={{ color: "#0d3b66" }}>Employee Portal</h2>
            <p className="fs-5" style={{ color: "#1a6fc4" }}>Secure access to your digital workspace</p>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            {/* Email Field */}
            <div className="mb-4">
              <label className="form-label fw-medium mb-2" style={{ color: "#0d3b66" }}>Work Email</label>
              <div className={`input-group border rounded-3 overflow-hidden ${focusedField === 'email' ? 'border-primary shadow-sm' : 'border-light'}`} style={{ 
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                borderColor: "#dee2e6 !important"
              }}>
                <span className="input-group-text bg-white border-0 pe-1">
                  <i className="bi bi-envelope-fill fs-5" style={{ color: "#1a6fc4" }}></i>
                </span>
                <input
                  type="email"
                  className="form-control border-0 py-3 shadow-none"
                  placeholder="name@arcapcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoFocus
                  style={{
                    backgroundColor: "#fff",
                    color: "#0d3b66"
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label fw-medium mb-2" style={{ color: "#0d3b66" }}>Password</label>
              <div className={`input-group border rounded-3 overflow-hidden ${focusedField === 'password' ? 'border-primary shadow-sm' : 'border-light'}`} style={{ 
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                borderColor: "#dee2e6 !important"
              }}>
                <span className="input-group-text bg-white border-0 pe-1">
                  <i className="bi bi-lock-fill fs-5" style={{ color: "#1a6fc4" }}></i>
                </span>
                <input
                  type="password"
                  className="form-control border-0 py-3 shadow-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    backgroundColor: "#fff",
                    color: "#0d3b66"
                  }}
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ 
                    width: "18px", 
                    height: "18px",
                    cursor: "pointer",
                    borderColor: "#1a6fc4"
                  }}
                />
                <label className="form-check-label ms-2" htmlFor="rememberMe" style={{ color: "#0d3b66" }}>
                  Remember me
                </label>
              </div>
              <button 
                type="button"
                className="btn btn-link text-decoration-none p-0 fw-medium"
                style={{ color: "#1a6fc4" }}
                onClick={() => toast.info("Password reset feature coming soon!")}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn w-100 py-3 fw-bold mb-4 position-relative"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #1a6fc4 0%, #0d47a1 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 6px rgba(13, 71, 161, 0.25)",
                fontSize: "1.1rem",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = "0 6px 12px rgba(13, 71, 161, 0.35)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = "0 4px 6px rgba(13, 71, 161, 0.25)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Access My Dashboard
                </>
              )}
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                transform: loading ? "none" : "translateX(-100%)",
                transition: "transform 0.7s ease-in-out"
              }}></div>
            </button>
          </form>
          
          {/* Footer */}
          <div className="text-center border-top pt-4" style={{ borderColor: "#dee2e6 !important" }}>
            <div className="d-flex justify-content-center gap-4 mb-3">
              <button 
                className="btn btn-link text-decoration-none p-0 fw-medium"
                style={{ color: "#1a6fc4" }}
                onClick={() => openExternalLink("https://arcapreit.com/security.html")}
              >
                <i className="bi bi-shield-lock me-1"></i> Security
              </button>
              <button 
                className="btn btn-link text-decoration-none p-0 fw-medium"
                style={{ color: "#1a6fc4" }}
                onClick={() => openExternalLink("https://arcapreit.com/privacy.html")}
              >
                <i className="bi bi-file-earmark-text me-1"></i> Privacy
              </button>
              <button 
                className="btn btn-link text-decoration-none p-0 fw-medium"
                style={{ color: "#1a6fc4" }}
                onClick={() => openExternalLink("https://arcapreit.com/help.html")}
              >
                <i className="bi bi-info-circle me-1"></i> Help
              </button>
            </div>
            <p className="small mb-0" style={{ color: "#6c757d" }}>
              © {new Date().getFullYear()} Arcap Technologies Inc. All rights reserved.
            </p>
            <p className="small mt-1" style={{ color: "#6c757d" }}>v2.7.0 • Secure Employee Portal</p>
          </div>
        </div>
        
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </div>
    </div>
  );
};

export default Login;