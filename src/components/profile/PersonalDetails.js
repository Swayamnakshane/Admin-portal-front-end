import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PersonalDetails.css";

const genderOptions = ["Male", "Female", "Other"];
const maritalOptions = ["Single", "Married"];

const PersonalDetails = () => {
  const [form, setForm] = useState({
    phone: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    nationality: "",
    aadhar_number: "",
    pan_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingData, setIsExistingData] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get("/employee/get-details");
        if (res.data?.data && Object.keys(res.data.data).length > 0) {
          const data = res.data.data;
          
          // Convert backend date (dd/mm/yyyy) to frontend format (yyyy-mm-dd)
          if (data.date_of_birth && typeof data.date_of_birth === 'string') {
            if (data.date_of_birth.includes('/')) {
              const [dd, mm, yyyy] = data.date_of_birth.split('/');
              data.date_of_birth = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
            }
            // Handle existing dash format if present
            else if (data.date_of_birth.includes('-')) {
              const [dd, mm, yyyy] = data.date_of_birth.split('-');
              data.date_of_birth = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
            }
          }
          
          setForm(data);
          setIsExistingData(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setIsExistingData(false);
        } else {
          toast.error("❌ Failed to fetch personal details.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { phone, date_of_birth, gender, marital_status, aadhar_number, pan_number } = form;

    if (!phone) newErrors.phone = "Phone is required.";
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = "Phone must be 10 digits.";
    if (!date_of_birth) newErrors.date_of_birth = "Date of birth is required.";
    if (!gender) newErrors.gender = "Gender is required.";
    if (!marital_status) newErrors.marital_status = "Marital status is required.";
    if (aadhar_number && !/^\d{12}$/.test(aadhar_number)) newErrors.aadhar_number = "Aadhar must be 12 digits.";
    if (pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan_number)) newErrors.pan_number = "Invalid PAN (ABCDE1234F).";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.warn("⚠️ Please correct the highlighted fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setButtonDisabled(true);
    const method = isExistingData ? "put" : "post";
    const endpoint = method === "post" 
      ? "/employee/personal-details" 
      : "/employee/personal-details/update";

    // Convert date to backend format (yyyy-mm-dd → dd/mm/yyyy)
    const formattedForm = {
      ...form,
      date_of_birth: form.date_of_birth
        ? form.date_of_birth.split("-").reverse().join("/") // Converts yyyy-mm-dd to dd/mm/yyyy
        : ""
    };

    try {
      await api[method](endpoint, formattedForm);
      toast.success(`✅ ${isExistingData ? "Details updated" : "Details submitted"} successfully.`);
      setIsExistingData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Something went wrong.");
    } finally {
      setButtonDisabled(false);
    }
  };

  if (isLoading) return <div className="text-center mt-5">Loading personal details...</div>;

  return (
    <div className="container-fluid">
      <ToastContainer position="top-right" autoClose={3000} />
      <h5 className="mb-4 fw-bold text-primary">Personal Details</h5>
      <form className="row g-3">
        {Object.keys(form).map((key) => (
          <div className="col-md-6" key={key}>
            <label className="form-label text-capitalize">
              {key.replace(/_/g, " ")}
              {(key === "date_of_birth" || key === "phone") && <span className="text-danger">*</span>}
            </label>

            {(key === "gender" || key === "marital_status") ? (
              <select
                name={key}
                className={`form-select ${errors[key] ? "is-invalid" : ""}`}
                value={form[key] || ""}
                onChange={handleChange}
              >
                <option value="">Select {key.replace(/_/g, " ")}</option>
                {(key === "gender" ? genderOptions : maritalOptions).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                name={key}
                className={`form-control ${errors[key] ? "is-invalid" : ""}`}
                type={key === "date_of_birth" ? "date" : "text"}
                value={form[key] || ""}
                onChange={handleChange}
                disabled={key === "country"}
              />
            )}

            {errors[key] && <div className="invalid-feedback">{errors[key]}</div>}
          </div>
        ))}

        <div className="col-12 text-end mt-3">
          <button
            type="button"
            className={`btn ${isExistingData ? "btn-primary" : "btn-success"}`}
            onClick={handleSubmit}
            disabled={buttonDisabled}
          >
            {buttonDisabled ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </span>
            ) : isExistingData ? (
              "Update"
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDetails;