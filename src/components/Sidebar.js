import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTachometerAlt, FaUserCircle, FaTasks, FaChalkboardTeacher, FaSignOutAlt } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Sidebar = () => {
  const navigate = useNavigate();

  const name = localStorage.getItem("name") || "Employee";
  const employeeId = localStorage.getItem("employee_id") || "EMP-ID";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div
      className="sidebar d-flex flex-column justify-content-between bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      <div>
        <div className="text-center mb-4">
          <img
            src="https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230"
            alt="logo"
            style={{ width: 100 }}
            className="mb-2"
          />
          <div className="text-white fw-bold mb-1"></div>
          <img
            src="https://www.w3schools.com/howto/img_avatar.png"
            alt="profile"
            className="rounded-circle"
            width="70"
            height="70"
          />
          <h6 className="mt-2 mb-0">{name}</h6>
          <small>{employeeId}</small>
        </div>

        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link to="/dashboard" className="nav-link text-white d-flex align-items-center">
              <FaTachometerAlt className="me-2" />
              Dashboard
            </Link>
          </li>

          <li className="nav-item mb-2">
            <div className="text-white fw-bold ps-2 mb-1">Profile</div>
            <div className="nav nav-pills flex-column ms-3">
              <Link
                to="/dashboard/profile/personal"
                className="nav-link text-white py-1 px-2"
                style={{ fontSize: "0.9rem" }}
              >
                <FaUserCircle className="me-2" />
                Personal
              </Link>
              <Link
                to="/dashboard/profile/professional"
                className="nav-link text-white py-1 px-2"
                style={{ fontSize: "0.9rem" }}
              >
                <FaUserCircle className="me-2" />
                Professional
              </Link>
            </div>
          </li>

          <li className="nav-item mb-2 mt-2">
            <Link to="/dashboard/tasks" className="nav-link text-white d-flex align-items-center">
              <FaTasks className="me-2" />
              Tasks
            </Link>
          </li>

          <li className="nav-item mb-2">
            <Link to="/dashboard/meetings" className="nav-link text-white d-flex align-items-center">
              <FaChalkboardTeacher className="me-2" />
              Meetings
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/documents" className="nav-link text-white d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-2"></i>
              Documents 
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/timesheet" className="nav-link text-white d-flex align-items-center">
              <i className="bi bi-clock me-2"></i>Timesheet
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/training&learning" className="nav-link text-white d-flex align-items-center">
              <i className="bi bi-calendar-check me-2"></i>Training & Learning
            </Link>

          </li>
          <li className="nav-item mb-2">
            <Link to="/dashboard/projects" className="nav-link text-white d-flex align-items-center">
              <i className="bi bi-grid me-2"></i>Projects
            </Link>
          </li>
        </ul>
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-outline-light w-100" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
