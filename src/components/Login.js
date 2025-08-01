import React, { useState } from "react";
import axios from "axios";
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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/employee/login", {
        email,
        password,
      });

      const { access_token, refresh_token, message, name, employee_id } = res.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("name", name);
      localStorage.setItem("employee_id", employee_id);

      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100" style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: "hidden"
    }}>
      {/* Left Section - Company Branding */}
      <div className="d-none d-lg-flex col-lg-7 p-5 position-relative" style={{
        background: "linear-gradient(135deg, #0f1b3a 0%, #1a2a6c 100%)",
        color: "white"
      }}>
        {/* Background pattern */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "url('https://www.transparenttextures.com/patterns/diagmonds.png')",
          opacity: 0.1
        }}></div>
        
        {/* Company Logo */}
        <div className="text-center mb-5" style={{ zIndex: 2, marginTop: "5rem" }}>
          <div className="mb-4">
            <img
              src="https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230"
              alt="Arcap Company Logo"
              style={{ 
                height: "120px",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
              }}
            />
          </div>
          <h1 className="display-4 fw-bold mb-3">Arcap Technologies</h1>
          <p className="fs-4 mb-0">Empowering the Future of Enterprise Solutions</p>
        </div>
        
        {/* Company Information */}
        <div className="position-absolute bottom-0 start-0 end-0 p-5" style={{ zIndex: 2 }}>
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-2 me-3">
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
                <div>
                  <h5 className="fw-bold">Enterprise Security</h5>
                  <p className="mb-0">Military-grade protection</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-4 mb-md-0">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-2 me-3">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
                <div>
                  <h5 className="fw-bold">Global Team</h5>
                  <p className="mb-0">15,000+ professionals</p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-2 me-3">
                  <i className="bi bi-award-fill fs-3"></i>
                </div>
                <div>
                  <h5 className="fw-bold">Certified</h5>
                  <p className="mb-0">ISO 27001 Certified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="col-12 col-lg-5 d-flex align-items-center justify-content-center p-4" style={{
        background: "#ffffff",
        position: "relative",
        overflow: "auto"
      }}>
        <div className="w-100" style={{ maxWidth: "450px" }}>
          <div className="text-center mb-5">
            {/* <h2 className="fw-bold text-primary">Employee Portal</h2>
            <p className="text-muted">Secure access to your digital workspace</p> */}
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-4">
              <label className="form-label fw-medium text-secondary">Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope-fill text-primary"></i>
                </span>
                <input
                  type="email"
                  className="form-control py-3 border-start-0"
                  placeholder="name@arcapcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock-fill text-primary"></i>
                </span>
                <input
                  type="password"
                  className="form-control py-3 border-start-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ 
                    width: "20px", 
                    height: "20px",
                    border: "2px solid #3498db",
                    cursor: "pointer"
                  }}
                />
                <label className="form-check-label ms-2" htmlFor="rememberMe" style={{ 
                  color: "#495057", 
                  cursor: "pointer"
                }}>
                  Keep me logged in
                </label>
              </div>
              <a href="#" className="text-decoration-none text-primary fw-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 fw-bold mb-4"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #3498db 0%, #1a5f9e 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                transition: "all 0.3s ease",
                boxShadow: "0 5px 15px rgba(52, 152, 219, 0.4)",
                fontSize: "1.1rem",
                position: "relative",
                overflow: "hidden"
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
                "Access My Dashboard"
              )}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                transform: "translateX(-100%)",
                transition: "transform 0.5s"
              }}></div>
            </button>
          </form>
          
          <div className="text-center mb-5">
            <div className="d-flex align-items-center justify-content-center mb-4">
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e9ecef" }}></div>
              <div className="mx-3 text-muted">Or continue with</div>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e9ecef" }}></div>
            </div>
            
            <button className="btn btn-outline-secondary w-100 py-2 mb-3">
              <i className="bi bi-google me-2"></i> Sign in with Google
            </button>
          </div>
          
          <div className="text-center border-top pt-4">
            <div className="d-flex justify-content-center gap-4 mb-3">
              <a href="#" className="text-decoration-none text-secondary">
                <i className="bi bi-shield-lock me-1"></i> Security
              </a>
              <a href="#" className="text-decoration-none text-secondary">
                <i className="bi bi-file-earmark-text me-1"></i> Privacy
              </a>
              <a href="#" className="text-decoration-none text-secondary">
                <i className="bi bi-info-circle me-1"></i> Help
              </a>
            </div>
            <p className="text-muted small mb-0">
              © {new Date().getFullYear()} Arcap Technologies Inc. All rights reserved.
            </p>
            <p className="small text-muted mt-1">v2.5.1 • Secure Employee Portal</p>
          </div>
        </div>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Login;