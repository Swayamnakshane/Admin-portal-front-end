import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./sidebar";
import Meetings from "./meetings/meeting";
import TaskManagementDashboard from "./task/task";
import DocumentVerificationAdmin from "./Documents/documents";
import EmployeeManagement from "./UploadEmployee/employee";
import RecordingManagement from "./recording/Record";
import AdminTimesheetManager from "./Timesheet/timesheet";

const Dashboard = () => {
  const name = localStorage.getItem("name") || "Admin";

  return (
    <div className="dashboard d-flex">
      <Sidebar />
      <div
        className="content"
        style={{
          padding: "2rem",
          backgroundColor: "#f1f4f9",
          minHeight: "100vh",
          flex: 1,
        }}
      >
        <h2 className="mb-4">Welcome, {name}</h2>

        {/* Nested routes here */}
        <Routes>
          <Route path="meetings" element={<Meetings />} /> {/* relative path */}
          <Route path="tasks" element={<TaskManagementDashboard/>} />
          <Route path="documents" element={<DocumentVerificationAdmin />} />
          <Route path="employee/upload" element={<EmployeeManagement/>} />
          <Route path="recordings" element={<RecordingManagement />} />
          <Route path="timesheet" element={<AdminTimesheetManager />} />
          {/* Add more routes as needed */}
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
