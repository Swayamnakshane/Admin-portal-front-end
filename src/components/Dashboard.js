
// src/components/Dashboard/index.js (updated)
import React from "react";
import Sidebar from "./Sidebar";
import Task from "./Task/task";
import Meetings from "../Meetings/meetings";
import TimeSheet from "./TimeSheet/Timesheet";
import DocumentsAndBankDetails from "./Documents/documents";
import TrainingLearning from "./Training/training";
import ProjectDashboard from "./Project/project";
import { Routes, Route } from "react-router-dom";
import PersonalDetails from "./profile/PersonalDetails";
import ProfessionalDetails from "./profile/ProfessionalDetails";
import MeetingRecordings from "./Recording/recording"; // Importing the MeetingRecordings component
import DashboardHome  from "./Dashboardhome"; // Assuming you have a DashboardHome component

const Dashboard = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          marginLeft: "250px",
          padding: "2rem",
          backgroundColor: "#f1f4f9",
          minHeight: "100vh",
          width: "calc(100% - 250px)",
        }}
      >
        <Routes>
          <Route index element={<DashboardHome />} /> {/* Default dashboard */}
          <Route path="profile/personal" element={<PersonalDetails />} />
          <Route path="profile/professional" element={<ProfessionalDetails />} />
          <Route path="tasks" element={<Task />} />
          <Route path="meetings" element={<Meetings />} /> 
          <Route path="documents" element={<DocumentsAndBankDetails />} />
          <Route path="timesheet" element={<TimeSheet />} />
          <Route path="training&learning" element={<TrainingLearning/>} />
          <Route path="projects" element={<ProjectDashboard />} />
          <Route path="recording" element={<MeetingRecordings />} /> {/* Updated path for recordings */}
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;