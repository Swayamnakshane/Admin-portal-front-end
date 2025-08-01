import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProfessionalDetails.css";

const employmentTypes = ["Full-time", "Part-time", "Internship"];

// Helper functions for date conversion
const inputToBackendDate = (dateStr) => {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const backendToInputDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
};

// ... existing imports ...

const ProfessionalDetails = () => {
  // Memoize initial form state
  const initialFormState = useMemo(() => ({
    education: "",
    specialization: "",
    college_name: "",
    year_of_passing: "",
    current_job_title: "",
    company_name: "",
    job_description: "",
    from_date: "",
    to_date: "",
    currently_working: true,
    skills: [],
    languages_known: [],
    linkedin_profile: "",
    github_profile: "",
    portfolio_website: "",
    bio: "",
    previous_experiences: []
  }), []); // Empty dependency array means it's created only once

  // Rest of the component code remains the same...


  const [form, setForm] = useState(initialFormState);
  const [experience, setExperience] = useState({
    company_name: "",
    job_title: "",
    employment_type: "Full-time",
    job_description: "",
    from_date: "",
    to_date: ""
  });
  const [errors, setErrors] = useState({});
  const [isExistingData, setIsExistingData] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing professional details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get("/employee/get-professional-details");
        if (res.data?.data) {
          // Convert backend dates to input format and handle missing fields
          const formattedData = {
            ...initialFormState,
            ...res.data.data,
            from_date: backendToInputDate(res.data.data.from_date || ""),
            to_date: backendToInputDate(res.data.data.to_date || ""),
            previous_experiences: (res.data.data.previous_experiences || []).map(exp => ({
              company_name: exp.company_name || "",
              job_title: exp.job_title || "",
              employment_type: exp.employment_type || "Full-time",
              job_description: exp.job_description || "",
              from_date: backendToInputDate(exp.from_date || ""),
              to_date: backendToInputDate(exp.to_date || "")
            }))
          };
          
          setForm(formattedData);
          setIsExistingData(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No existing professional details found");
        } else {
          toast.error("❌ Failed to load professional details");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [initialFormState]);

  // Handle main form changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear relevant error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle array fields (skills, languages)
  const handleArrayChange = (field, value) => {
    const arr = value.split(",")
      .map(item => item.trim())
      .filter(Boolean);
    
    setForm(prev => ({ ...prev, [field]: arr }));
  };

  // Handle experience form changes
  const handleExperienceChange = (e) => {
    const { name, value } = e.target;
    setExperience(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate experience before adding
  const validateExperience = () => {
    const newErrors = {};
    if (!experience.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }
    if (!experience.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    }
    if (!experience.from_date) {
      newErrors.from_date = "Start date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new experience
  const addExperience = () => {
    if (!validateExperience()) {
      toast.warn("⚠️ Please fill required fields in experience");
      return;
    }
    
    setForm(prev => ({
      ...prev,
      previous_experiences: [...prev.previous_experiences, experience]
    }));
    
    // Reset experience form
    setExperience({
      company_name: "",
      job_title: "",
      employment_type: "Full-time",
      job_description: "",
      from_date: "",
      to_date: ""
    });
  };

  // Validate main form
  const validateForm = () => {
    const newErrors = {};
    
    // Education validation
    if (!form.education.trim()) {
      newErrors.education = "Education level is required";
    }
    if (!form.college_name.trim()) {
      newErrors.college_name = "College name is required";
    }
    if (!form.year_of_passing) {
      newErrors.year_of_passing = "Year of passing is required";
    } else if (!/^\d{4}$/.test(form.year_of_passing)) {
      newErrors.year_of_passing = "Year must be 4 digits";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form data
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("❌ Please fix the errors before submitting");
      return;
    }
    
    setButtonDisabled(true);
    
    try {
      // Prepare data with proper date formats
      const payload = {
        ...form,
        from_date: inputToBackendDate(form.from_date),
        to_date: inputToBackendDate(form.to_date),
        previous_experiences: form.previous_experiences.map(exp => ({
          ...exp,
          from_date: inputToBackendDate(exp.from_date),
          to_date: inputToBackendDate(exp.to_date)
        }))
      };
      
      // Remove empty values
      Object.keys(payload).forEach(key => {
        if (payload[key] === "" || 
            (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });
      
      const endpoint = isExistingData 
        ? "/employee/ProfessionalDetails/update" 
        : "/employee/ProfessionalDetails";
      
      const method = isExistingData ? "put" : "post";
      
      await api[method](endpoint, payload);
      
      toast.success(`✅ Professional details ${isExistingData ? "updated" : "saved"} successfully`);
      setIsExistingData(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Submission failed. Please try again.";
      toast.error(`❌ ${errorMessage}`);
      console.error("Submission error:", err.response?.data);
    } finally {
      setButtonDisabled(false);
    }
  };

  // Remove experience
  const removeExperience = (index) => {
    setForm(prev => {
      const updatedExperiences = [...prev.previous_experiences];
      updatedExperiences.splice(index, 1);
      return { ...prev, previous_experiences: updatedExperiences };
    });
    toast.info("Experience removed");
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <h3 className="mb-4 border-bottom pb-2">Professional Details</h3>

      <div className="row g-3">
        {/* Education Section */}
        <div className="col-md-6">
          <label className="form-label fw-semibold">Education Level *</label>
          <input
            type="text"
            name="education"
            className={`form-control ${errors.education ? "is-invalid" : ""}`}
            value={form.education}
            onChange={handleFormChange}
            placeholder="E.g., B.Tech, MBA"
          />
          {errors.education && (
            <div className="invalid-feedback">{errors.education}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Specialization</label>
          <input
            type="text"
            name="specialization"
            className="form-control"
            value={form.specialization}
            onChange={handleFormChange}
            placeholder="Your field of study"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Institution Name *</label>
          <input
            type="text"
            name="college_name"
            className={`form-control ${errors.college_name ? "is-invalid" : ""}`}
            value={form.college_name}
            onChange={handleFormChange}
            placeholder="College/University"
          />
          {errors.college_name && (
            <div className="invalid-feedback">{errors.college_name}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Graduation Year *</label>
          <input
            type="text"
            name="year_of_passing"
            className={`form-control ${errors.year_of_passing ? "is-invalid" : ""}`}
            value={form.year_of_passing}
            onChange={handleFormChange}
            placeholder="YYYY"
            maxLength="4"
          />
          {errors.year_of_passing && (
            <div className="invalid-feedback">{errors.year_of_passing}</div>
          )}
        </div>

        {/* Skills Section */}
        <div className="col-md-6">
          <label className="form-label fw-semibold">Technical Skills</label>
          <input
            type="text"
            className="form-control"
            value={form.skills.join(", ")}
            onChange={(e) => handleArrayChange("skills", e.target.value)}
            placeholder="Comma separated (e.g., JavaScript, React, Node.js)"
          />
          <div className="form-text">Add your top 5-10 skills</div>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Languages</label>
          <input
            type="text"
            className="form-control"
            value={form.languages_known.join(", ")}
            onChange={(e) => handleArrayChange("languages_known", e.target.value)}
            placeholder="Comma separated (e.g., English, Spanish)"
          />
        </div>

        {/* Current Employment */}
        <div className="col-12 mt-4">
          <h5 className="border-bottom pb-2">Current Employment</h5>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Job Title</label>
          <input
            type="text"
            name="current_job_title"
            className={`form-control ${errors.current_job_title ? "is-invalid" : ""}`}
            value={form.current_job_title}
            onChange={handleFormChange}
            placeholder="Your current position"
          />
          {errors.current_job_title && (
            <div className="invalid-feedback">{errors.current_job_title}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Company</label>
          <input
            type="text"
            name="company_name"
            className="form-control"
            value={form.company_name}
            onChange={handleFormChange}
            placeholder="Your current employer"
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Job Description</label>
          <textarea
            name="job_description"
            className="form-control"
            rows={3}
            value={form.job_description}
            onChange={handleFormChange}
            placeholder="Describe your role and responsibilities"
          />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Start Date</label>
          <input
            type="date"
            name="from_date"
            className="form-control"
            value={form.from_date || ""}
            onChange={handleFormChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">End Date</label>
          <input
            type="date"
            name="to_date"
            className={`form-control ${errors.to_date ? "is-invalid" : ""}`}
            value={form.to_date || ""}
            onChange={handleFormChange}
            disabled={form.currently_working}
            min={form.from_date || undefined}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.to_date && (
            <div className="invalid-feedback">{errors.to_date}</div>
          )}
        </div>

        <div className="col-md-6 d-flex align-items-end">
          <div className="form-check">
            <input
              type="checkbox"
              id="currently_working"
              name="currently_working"
              className="form-check-input"
              checked={form.currently_working}
              onChange={handleFormChange}
            />
            <label className="form-check-label" htmlFor="currently_working">
              I currently work here
            </label>
          </div>
        </div>

        {/* Previous Experience */}
        <div className="col-12 mt-4">
          <h5 className="border-bottom pb-2">Work History</h5>
          
          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Add Previous Position</h6>
              
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    type="text"
                    name="company_name"
                    placeholder="Company *"
                    className={`form-control ${errors.company_name ? "is-invalid" : ""}`}
                    value={experience.company_name}
                    onChange={handleExperienceChange}
                  />
                  {errors.company_name && (
                    <div className="invalid-feedback">{errors.company_name}</div>
                  )}
                </div>

                <div className="col-md-3">
                  <input
                    type="text"
                    name="job_title"
                    placeholder="Position *"
                    className={`form-control ${errors.job_title ? "is-invalid" : ""}`}
                    value={experience.job_title}
                    onChange={handleExperienceChange}
                  />
                  {errors.job_title && (
                    <div className="invalid-feedback">{errors.job_title}</div>
                  )}
                </div>

                <div className="col-md-3">
                  <select
                    name="employment_type"
                    className="form-select"
                    value={experience.employment_type}
                    onChange={handleExperienceChange}
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small mb-0">Start Date *</label>
                      <input
                        type="date"
                        name="from_date"
                        className={`form-control ${errors.from_date ? "is-invalid" : ""}`}
                        value={experience.from_date}
                        onChange={handleExperienceChange}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.from_date && (
                        <div className="invalid-feedback">{errors.from_date}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small mb-0">End Date</label>
                      <input
                        type="date"
                        name="to_date"
                        className="form-control"
                        value={experience.to_date}
                        onChange={handleExperienceChange}
                        min={experience.from_date || undefined}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <textarea
                    name="job_description"
                    placeholder="Responsibilities and achievements"
                    className="form-control mt-2"
                    rows={2}
                    value={experience.job_description}
                    onChange={handleExperienceChange}
                  />
                </div>

                <div className="col-12 mt-2">
                  <button 
                    className="btn btn-primary"
                    onClick={addExperience}
                    disabled={!experience.company_name || !experience.job_title || !experience.from_date}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Add Position
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Experience List */}
          {form.previous_experiences.length > 0 && (
            <div className="mt-4">
              <h6>Your Work Experience</h6>
              <div className="list-group">
                {form.previous_experiences.map((exp, idx) => (
                  <div key={idx} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{exp.job_title}</h6>
                        <div className="d-flex flex-wrap mb-1">
                          <span className="me-3"><strong>{exp.company_name}</strong></span>
                          <span className="badge bg-secondary me-2">{exp.employment_type}</span>
                        </div>
                        <small className="text-muted">
                          {exp.from_date} - {exp.to_date || 'Present'}
                        </small>
                        {exp.job_description && (
                          <p className="mt-2 mb-0 small">{exp.job_description}</p>
                        )}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeExperience(idx)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Online Presence */}
        <div className="col-12 mt-4">
          <h5 className="border-bottom pb-2">Online Profiles</h5>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">
            <i className="bi bi-linkedin me-2 text-primary"></i>LinkedIn
          </label>
          <div className="input-group">
            <span className="input-group-text">linkedin.com/in/</span>
            <input
              type="text"
              name="linkedin_profile"
              className="form-control"
              value={form.linkedin_profile}
              onChange={handleFormChange}
              placeholder="your-profile"
            />
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">
            <i className="bi bi-github me-2"></i>GitHub
          </label>
          <div className="input-group">
            <span className="input-group-text">github.com/</span>
            <input
              type="text"
              name="github_profile"
              className="form-control"
              value={form.github_profile}
              onChange={handleFormChange}
              placeholder="your-username"
            />
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">
            <i className="bi bi-globe me-2 text-success"></i>Portfolio
          </label>
          <input
            type="url"
            name="portfolio_website"
            className="form-control"
            value={form.portfolio_website}
            onChange={handleFormChange}
            placeholder="https://yourportfolio.com"
          />
        </div>

        {/* Professional Summary */}
        <div className="col-12 mt-3">
          <label className="form-label fw-semibold">Professional Summary</label>
          <textarea
            name="bio"
            className="form-control"
            rows={4}
            value={form.bio}
            onChange={handleFormChange}
            placeholder="Describe your professional background, skills, and achievements..."
          />
          <div className="form-text">Max 500 characters</div>
        </div>

        {/* Submit Section */}
        <div className="col-12 mt-4 pt-3 border-top text-end">
          <button
            type="button"
            className={`btn ${isExistingData ? "btn-primary" : "btn-success"} px-4`}
            onClick={handleSubmit}
            disabled={buttonDisabled}
          >
            {buttonDisabled ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {isExistingData ? "Updating..." : "Saving..."}
              </span>
            ) : isExistingData ? (
              <><i className="bi bi-save me-2"></i>Update Details</>
            ) : (
              <><i className="bi bi-check-circle me-2"></i>Save Details</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetails;