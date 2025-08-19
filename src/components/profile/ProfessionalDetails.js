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

// Validation function
const validateURL = (url) => {
  if (!url) return true; // Empty URL is acceptable
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

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
  }), []);

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
  const [skillsInput, setSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [touchedFields, setTouchedFields] = useState({});

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
            // Ensure bio is never null
            bio: res.data.data.bio || "",
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
          setSkillsInput(formattedData.skills.join(", "));
          setLanguagesInput(formattedData.languages_known.join(", "));
          setIsExistingData(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No existing professional details found");
        } else {
          toast.error("❌ Failed to load professional details. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDetails();
  }, [initialFormState]);

  // Handle field blur events
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Validate specific fields on blur
    if (name === "year_of_passing") {
      if (!form.year_of_passing) {
        setErrors(prev => ({ ...prev, year_of_passing: "Graduation year is required" }));
      } else if (!/^\d{4}$/.test(form.year_of_passing)) {
        setErrors(prev => ({ ...prev, year_of_passing: "Year must be 4 digits" }));
      } else if (parseInt(form.year_of_passing) > new Date().getFullYear()) {
        setErrors(prev => ({ ...prev, year_of_passing: "Year cannot be in the future" }));
      } else {
        setErrors(prev => ({ ...prev, year_of_passing: undefined }));
      }
    }
    
    if (name === "portfolio_website" && form.portfolio_website && !validateURL(form.portfolio_website)) {
      setErrors(prev => ({ ...prev, portfolio_website: "Please enter a valid URL" }));
    }
  };

  // Handle main form changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear relevant error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle skills input change
  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setSkillsInput(value);
    
    // Parse skills in real-time
    const skillsArray = value
      .split(",")
      .map(skill => skill.trim())
      .filter(skill => skill !== "");
    
    setForm(prev => ({ ...prev, skills: skillsArray }));
  };

  // Handle languages input change
  const handleLanguagesChange = (e) => {
    const value = e.target.value;
    setLanguagesInput(value);
    
    // Parse languages in real-time
    const languagesArray = value
      .split(",")
      .map(lang => lang.trim())
      .filter(lang => lang !== "");
    
    setForm(prev => ({ ...prev, languages_known: languagesArray }));
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
    } else if (experience.to_date && new Date(experience.from_date) > new Date(experience.to_date)) {
      newErrors.from_date = "Start date cannot be after end date";
    }
    
    if (experience.to_date && new Date(experience.to_date) > new Date()) {
      newErrors.to_date = "End date cannot be in the future";
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
    
    toast.success("✅ Experience added successfully");
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
    } else if (parseInt(form.year_of_passing) > new Date().getFullYear()) {
      newErrors.year_of_passing = "Year cannot be in the future";
    }
    
    // Date validation for current employment
    if (form.from_date && new Date(form.from_date) > new Date()) {
      newErrors.from_date = "Start date cannot be in the future";
    }
    
    if (!form.currently_working && form.to_date) {
      if (new Date(form.to_date) > new Date()) {
        newErrors.to_date = "End date cannot be in the future";
      }
      if (form.from_date && new Date(form.from_date) > new Date(form.to_date)) {
        newErrors.to_date = "End date cannot be before start date";
      }
    }
    
    // URL validation
    if (form.portfolio_website && !validateURL(form.portfolio_website)) {
      newErrors.portfolio_website = "Please enter a valid URL";
    }
    
    // Bio length validation
    if (form.bio && form.bio.length > 500) {
      newErrors.bio = "Professional summary cannot exceed 500 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form data
  const handleSubmit = async () => {
    // Mark all fields as touched to show errors
    const allFields = {
      education: true,
      college_name: true,
      year_of_passing: true,
      from_date: true,
      to_date: true,
      portfolio_website: true,
      bio: true
    };
    setTouchedFields(allFields);
    
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
      let errorMessage = "Submission failed. Please try again.";
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors) {
          // Handle field-specific errors from server
          const serverErrors = err.response.data.errors;
          errorMessage = "Please correct the highlighted fields";
          setErrors(serverErrors);
        }
      }
      
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

  // Character counter for bio - FIXED
  const bioCharacterCount = form.bio ? form.bio.length : 0;

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
            className={`form-control ${errors.education && touchedFields.education ? "is-invalid" : ""}`}
            value={form.education}
            onChange={handleFormChange}
            onBlur={handleBlur}
            placeholder="E.g., B.Tech, MBA"
          />
          {errors.education && touchedFields.education && (
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
            className={`form-control ${errors.college_name && touchedFields.college_name ? "is-invalid" : ""}`}
            value={form.college_name}
            onChange={handleFormChange}
            onBlur={handleBlur}
            placeholder="College/University"
          />
          {errors.college_name && touchedFields.college_name && (
            <div className="invalid-feedback">{errors.college_name}</div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Graduation Year *</label>
          <input
            type="text"
            name="year_of_passing"
            className={`form-control ${errors.year_of_passing && touchedFields.year_of_passing ? "is-invalid" : ""}`}
            value={form.year_of_passing}
            onChange={handleFormChange}
            onBlur={handleBlur}
            placeholder="YYYY"
            maxLength="4"
          />
          {errors.year_of_passing && touchedFields.year_of_passing && (
            <div className="invalid-feedback">{errors.year_of_passing}</div>
          )}
        </div>

        {/* Skills Section */}
        <div className="col-md-6">
          <label className="form-label fw-semibold">Technical Skills</label>
          <input
            type="text"
            className="form-control"
            value={skillsInput}
            onChange={handleSkillsChange}
            placeholder="Comma separated (e.g., JavaScript, React, Node.js)"
          />
          <div className="form-text">Add your top 5-10 skills</div>
          {form.skills.length > 0 && (
            <div className="mt-2">
              <small>Detected skills: {form.skills.join(", ")}</small>
            </div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Languages</label>
          <input
            type="text"
            className="form-control"
            value={languagesInput}
            onChange={handleLanguagesChange}
            placeholder="Comma separated (e.g., English, Spanish)"
          />
          {form.languages_known.length > 0 && (
            <div className="mt-2">
              <small>Detected languages: {form.languages_known.join(", ")}</small>
            </div>
          )}
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
            className="form-control"
            value={form.current_job_title}
            onChange={handleFormChange}
            placeholder="Your current position"
          />
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
            className={`form-control ${errors.from_date && touchedFields.from_date ? "is-invalid" : ""}`}
            value={form.from_date || ""}
            onChange={handleFormChange}
            onBlur={handleBlur}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.from_date && touchedFields.from_date && (
            <div className="invalid-feedback">{errors.from_date}</div>
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">End Date</label>
          <input
            type="date"
            name="to_date"
            className={`form-control ${errors.to_date && touchedFields.to_date ? "is-invalid" : ""}`}
            value={form.to_date || ""}
            onChange={handleFormChange}
            onBlur={handleBlur}
            disabled={form.currently_working}
            min={form.from_date || undefined}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.to_date && touchedFields.to_date && (
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
                        className={`form-control ${errors.to_date ? "is-invalid" : ""}`}
                        value={experience.to_date}
                        onChange={handleExperienceChange}
                        min={experience.from_date || undefined}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.to_date && (
                        <div className="invalid-feedback">{errors.to_date}</div>
                      )}
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
                        title="Remove experience"
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
            className={`form-control ${errors.portfolio_website && touchedFields.portfolio_website ? "is-invalid" : ""}`}
            value={form.portfolio_website}
            onChange={handleFormChange}
            onBlur={handleBlur}
            placeholder="https://yourportfolio.com"
          />
          {errors.portfolio_website && touchedFields.portfolio_website && (
            <div className="invalid-feedback">{errors.portfolio_website}</div>
          )}
        </div>

        {/* Professional Summary */}
        <div className="col-12 mt-3">
          <label className="form-label fw-semibold">Professional Summary</label>
          <textarea
            name="bio"
            className={`form-control ${errors.bio && touchedFields.bio ? "is-invalid" : ""}`}
            rows={4}
            value={form.bio}
            onChange={handleFormChange}
            onBlur={handleBlur}
            placeholder="Describe your professional background, skills, and achievements..."
          />
          <div className="d-flex justify-content-between">
            <div className="form-text">Max 500 characters</div>
            <div className={`form-text ${bioCharacterCount > 500 ? 'text-danger' : ''}`}>
              {bioCharacterCount}/500
            </div>
          </div>
          {errors.bio && touchedFields.bio && (
            <div className="invalid-feedback d-block">{errors.bio}</div>
          )}
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