// import React, { useState, useEffect } from "react";
// import api from "../../api/api";
// import "./PersonalDetails.css";
// import { ToastContainer, toast } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';

// const genderOptions = ["Male", "Female", "Other"];
// const maritalOptions = ["Single", "Married"];

// const PersonalDetails = () => {
//   const [form, setForm] = useState({
//     phone: "",
//     date_of_birth: "",
//     gender: "",
//     marital_status: "",
//     nationality: "",
//     aadhar_number: "",
//     pan_number: "",
//     address_line1: "",
//     address_line2: "",
//     city: "",
//     state: "",
//     pincode: "",
//     country: "India",
//   });

//   const [errors, setErrors] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [isExistingData, setIsExistingData] = useState(false);
//   const [buttonDisabled, setButtonDisabled] = useState(false);

//   useEffect(() => {
//     const fetchDetails = async () => {
//       try {
//         const res = await api.get("/employee/get-details");
//         if (res.data?.data) {
//           const data = res.data.data;

//           if (data.date_of_birth) {
//             const [mm, dd, yyyy] = data.date_of_birth.split("/");
//             data.date_of_birth = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
//           }

//           setForm(data);
//           setIsExistingData(true);
//           toast.info("ℹ️ Existing personal details loaded.");
//         }
//       } catch (err) {
//         if (err.response?.status === 404) {
//           setIsExistingData(false);
//         } else {
//           toast.error("❌ Failed to fetch personal details.");
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchDetails();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     const { phone, date_of_birth, gender, marital_status, aadhar_number, pan_number } = form;

//     if (!phone) newErrors.phone = "Phone is required.";
//     else if (!/^(\+91)?[6-9][0-9]{9}$/.test(phone)) {
//       newErrors.phone = "Invalid Indian phone number.";
//     }

//     if (!date_of_birth) newErrors.date_of_birth = "Date of birth is required.";
//     if (!gender) newErrors.gender = "Gender is required.";
//     if (!marital_status) newErrors.marital_status = "Marital status is required.";

//     if (aadhar_number && !/^\d{12}$/.test(aadhar_number)) {
//       newErrors.aadhar_number = "Aadhar must be 12 digits.";
//     }

//     if (pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan_number)) {
//       newErrors.pan_number = "Invalid PAN (ABCDE1234F).";
//     }

//     setErrors(newErrors);

//     if (Object.keys(newErrors).length > 0) {
//       toast.warn("⚠️ Please correct the highlighted fields.");
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     const [yyyy, mm, dd] = form.date_of_birth.split("-");
//     const mmddyyyy = `${mm}/${dd}/${yyyy}`;

//     const formattedForm = {
//       ...form,
//       date_of_birth: mmddyyyy,
//     };

//     setButtonDisabled(true);
//     const method = isExistingData ? "put" : "post";
//     const endpoint = method === "post" ? "/employee/personal-details" : "/employee/personal-details/update";

//     try {
//       const res = await api[method](endpoint, formattedForm);
//       toast.success(`✅ ${isExistingData ? "Details updated" : "Details submitted"} successfully.`);
//       setIsExistingData(true);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "❌ Something went wrong.");
//     } finally {
//       setButtonDisabled(false);
//     }
//   };

//   if (isLoading) return <div className="text-center mt-5">Loading personal details...</div>;

//   return (
//     <div className="container-fluid">
//       <ToastContainer position="top-right" autoClose={3000} />
//       <h5 className="mb-4">Personal Details</h5>
//       <form className="row g-3">
//         <div className="col-md-6">
//           <label className="form-label">Phone *</label>
//           <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
//           {errors.phone && <small className="text-danger">{errors.phone}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Date of Birth *</label>
//           <input type="date" name="date_of_birth" className="form-control" value={form.date_of_birth || ""} onChange={handleChange} />
//           {errors.date_of_birth && <small className="text-danger">{errors.date_of_birth}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Gender *</label>
//           <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
//             <option value="">-- Select Gender --</option>
//             {genderOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
//           </select>
//           {errors.gender && <small className="text-danger">{errors.gender}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Marital Status *</label>
//           <select name="marital_status" className="form-select" value={form.marital_status} onChange={handleChange}>
//             <option value="">-- Select Marital Status --</option>
//             {maritalOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
//           </select>
//           {errors.marital_status && <small className="text-danger">{errors.marital_status}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Nationality</label>
//           <input name="nationality" className="form-control" value={form.nationality} onChange={handleChange} />
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Aadhar Number</label>
//           <input name="aadhar_number" className="form-control" value={form.aadhar_number} onChange={handleChange} maxLength="12" />
//           {errors.aadhar_number && <small className="text-danger">{errors.aadhar_number}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">PAN Number</label>
//           <input name="pan_number" className="form-control" value={form.pan_number} onChange={handleChange} />
//           {errors.pan_number && <small className="text-danger">{errors.pan_number}</small>}
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Address Line 1</label>
//           <input name="address_line1" className="form-control" value={form.address_line1} onChange={handleChange} />
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Address Line 2</label>
//           <input name="address_line2" className="form-control" value={form.address_line2} onChange={handleChange} />
//         </div>

//         <div className="col-md-4">
//           <label className="form-label">City</label>
//           <input name="city" className="form-control" value={form.city} onChange={handleChange} />
//         </div>

//         <div className="col-md-4">
//           <label className="form-label">State</label>
//           <input name="state" className="form-control" value={form.state} onChange={handleChange} />
//         </div>

//         <div className="col-md-4">
//           <label className="form-label">Pincode</label>
//           <input name="pincode" className="form-control" value={form.pincode} onChange={handleChange} />
//         </div>

//         <div className="col-md-6">
//           <label className="form-label">Country</label>
//           <input name="country" className="form-control" value={form.country} disabled />
//         </div>

//         <div className="col-12 text-end mt-3">
//           <button
//             type="button"
//             className={`btn ${isExistingData ? "btn-primary" : "btn-success"}`}
//             onClick={handleSubmit}
//             disabled={buttonDisabled}
//           >
//             {isExistingData ? "Update" : "Submit"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default PersonalDetails;

// ✅ PersonalDetails.js

// ✅ PersonalDetails.js

// ✅ PersonalDetails.js
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
          if (data.date_of_birth && data.date_of_birth.includes("-")) {
            const [dd, mm, yyyy] = data.date_of_birth.split("-");
            data.date_of_birth = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
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
    const [yyyy, mm, dd] = form.date_of_birth.split("-");
    const ddmmyyyy = `${dd}/${mm}/${yyyy}`;
    const formattedForm = { ...form, date_of_birth: ddmmyyyy };

    setButtonDisabled(true);
    const method = isExistingData ? "put" : "post";
    const endpoint = method === "post" ? "/employee/personal-details" : "/employee/personal-details/update";

    try {
      const res = await api[method](endpoint, formattedForm);
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
            <label className="form-label text-capitalize">{key.replace(/_/g, " ")}</label>

            {(key === "gender" || key === "marital_status") ? (
              <select
                name={key}
                className="form-select"
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
                className="form-control"
                type={key === "date_of_birth" ? "date" : "text"}
                value={form[key] || ""}
                onChange={handleChange}
                disabled={key === "country"}
              />
            )}

            {errors[key] && <small className="text-danger">{errors[key]}</small>}
          </div>
        ))}

        <div className="col-12 text-end mt-3">
          <button
            type="button"
            className={`btn ${isExistingData ? "btn-primary" : "btn-success"}`}
            onClick={handleSubmit}
            disabled={buttonDisabled}
          >
            {isExistingData ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDetails;
