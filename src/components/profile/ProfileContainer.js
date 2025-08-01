import React, { useState } from "react";
import PersonalDetails from "./PersonalDetails";
import ProfessionalDetails from "./ProfessionalDetails";

const ProfileContainer = () => {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div>
      <h4 className="mb-4">Profile Information</h4>
      <div className="d-flex mb-3">
        <button
          className={`btn me-2 ${activeTab === "personal" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("personal")}
        >
          Personal Details
        </button>
        <button
          className={`btn ${activeTab === "professional" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("professional")}
        >
          Professional Details
        </button>
      </div>
      <div className="card p-4 shadow-sm">
        {activeTab === "personal" ? <PersonalDetails /> : <ProfessionalDetails />}
      </div>
    </div>
  );
};

export default ProfileContainer;
