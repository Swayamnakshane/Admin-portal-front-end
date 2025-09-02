// Sidebar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./sidebar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Admin";
  const adminId = localStorage.getItem("admin_id") || "ADMIN";

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("admin_id");
    localStorage.removeItem("name");

    // Clear cookies
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to login page
    navigate("/login");
  };

  return (
    <div
      className="sidebar d-flex flex-column justify-content-between bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      {/* Top Profile Section */}
      <div>
        <div className="text-center mb-4">
          <div className="logo-placeholder mb-3">
            <div
              className="logo-initials bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{ width: "60px", height: "60px" }}
            >
              <span className="fw-bold fs-4">{name.charAt(0)}</span>
            </div>
          </div>

          <div className="profile-placeholder">
            <div
              className="profile-avatar bg-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{ width: "80px", height: "80px" }}
            >
              <span className="fw-bold fs-2">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          </div>

          <h6 className="mt-3 mb-0">{name}</h6>
          <small className="text-muted">ID: {adminId}</small>
        </div>

        {/* Navigation Links */}
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link
              to="/dashboard"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaTachometerAlt className="me-2" />
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/meetings"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Meetings
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/tasks"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Tasks
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/documents"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Documents of employees
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/employee/upload"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Upload Employee
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/recordings"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Recording Section
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link
              to="/dashboard/timesheet"
              className="nav-link text-white d-flex align-items-center"
            >
              <FaChalkboardTeacher className="me-2" />
              Timesheet of Employees
            </Link>
          </li>
        </ul>
      </div>

      {/* Logout Button */}
      <div className="text-center mt-4">
        <button
          className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="me-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
