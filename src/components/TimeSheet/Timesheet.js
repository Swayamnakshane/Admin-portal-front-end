import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Row, Col, Card, Form, Button, 
  Table, Badge, Alert, Spinner, ProgressBar,
  Modal, Dropdown, Tooltip, OverlayTrigger
} from "react-bootstrap";
import { 
  FaEdit, FaTrash, FaPlus, FaCheckCircle, 
  FaHistory, FaStopwatch, FaChartBar, FaInfoCircle,
  FaCalendarAlt, FaSyncAlt, FaExclamationTriangle,
  FaTasks, FaRegClock, FaChartLine, FaHourglassHalf,
  FaBusinessTime, FaChevronDown
} from "react-icons/fa";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

// Utility function to parse time string into moment object with multiple formats
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  
  // Try ISO format first
  if (moment(timeStr, moment.ISO_8601, true).isValid()) {
    return moment(timeStr);
  }
  
  // Try common time formats
  const formats = [
    "HH:mm:ss", 
    "HH:mm", 
    "HH:mm:ss.SSS", 
    "h:mm A", 
    "h:mm:ss A"
  ];
  
  for (const format of formats) {
    const parsed = moment(timeStr, format, true);
    if (parsed.isValid()) return parsed;
  }
  
  return null;
};

// Format time for display
const formatTimeDisplay = (time) => {
  const m = parseTime(time);
  return m?.isValid() ? m.format("h:mm A") : "--:--";
};

// Calculate duration between two times
const calculateDuration = (start, end) => {
  const startMoment = parseTime(start);
  const endMoment = parseTime(end);
  
  if (!startMoment?.isValid() || !endMoment?.isValid()) return "0.00";
  if (endMoment.isSameOrBefore(startMoment)) return "0.00";
  
  return endMoment.diff(startMoment, "hours", true).toFixed(2);
};

const TimesheetPage = () => {
  // State Management
  const [timesheet, setTimesheet] = useState(null);
  const [timeSlots, setTimeSlots] = useState([{ start_time: "", end_time: "", description: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const today = moment().format("YYYY-MM-DD");
  const isToday = selectedDate === today;
  const formattedDate = moment(selectedDate).format("MMMM D, YYYY");
  const isEditable = isToday && (timesheet?.status === "Pending" || timesheet?.status === "Draft" || !timesheet);
  const hasTimesheetData = timesheet !== null;

  // Status badge variants
  const statusVariants = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
    Draft: "secondary"
  };

  // Status icons
  const statusIcons = {
    Pending: <FaHourglassHalf />,
    Approved: <FaCheckCircle />,
    Rejected: <FaExclamationTriangle />,
    Draft: <FaStopwatch />
  };

  // Fetch timesheet data
  const fetchTimesheetData = useCallback(async () => {
    setIsLoading(true);
    setEditMode(false); // Reset edit mode on date change
    setApiErrors({});
    try {
      // Fetch daily timesheet
      const dailyResponse = await api.get(`/employee/daily/get-timesheet?date=${selectedDate}`);
      setTimesheet(dailyResponse.data);
      
      // Set time slots if timesheet exists
      if (dailyResponse.data) {
        setTimeSlots(dailyResponse.data.tasks.map(task => ({
          start_time: task.start_time,
          end_time: task.end_time,
          description: task.description
        })));
      } else {
        setTimeSlots([{ start_time: "", end_time: "", description: "" }]);
      }
      
      // Fetch summary data
      const summaryResponse = await api.get("/employee/summary/get-timesheet");
      setSummaryData(summaryResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setTimesheet(null);
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.message || 
                        "Failed to fetch timesheet data";
        setApiErrors(prev => ({ ...prev, fetchError: errorMsg }));
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTimesheetData();
  }, [fetchTimesheetData]);

  // Calculate total hours with proper validation
  const calculateTotalHours = () => {
    return timeSlots.reduce((total, slot) => {
      const start = parseTime(slot.start_time);
      const end = parseTime(slot.end_time);
      
      if (start?.isValid() && end?.isValid() && end.isAfter(start)) {
        return total + end.diff(start, "hours", true);
      }
      return total;
    }, 0).toFixed(2);
  };

  const totalHours = calculateTotalHours();

  // Handle time slot changes
  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
   
    
    // Clear error when user starts typing
    if (errors[`${field}-${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${field}-${index}`];
        return newErrors;
      });
    }
  };

  // Add new time slot
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start_time: "", end_time: "", description: "" }]);
  };

  // Remove time slot
  const removeTimeSlot = (index) => {
    if (timeSlots.length <= 1) return;
    const newTimeSlots = [...timeSlots];
    newTimeSlots.splice(index, 1);
    setTimeSlots(newTimeSlots);
    
    // Clear errors for this slot
    const slotErrors = Object.keys(errors).filter(key => key.includes(`-${index}`));
    if (slotErrors.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        slotErrors.forEach(errorKey => delete newErrors[errorKey]);
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    let totalHours = 0;
    const timeRanges = [];

    timeSlots.forEach((slot, index) => {
      // Validate description
      if (!slot.description.trim()) {
        newErrors[`description-${index}`] = "Description is required";
        isValid = false;
      }

      // Validate time format and logic
      const start = parseTime(slot.start_time);
      const end = parseTime(slot.end_time);
      
      if (!slot.start_time || !slot.end_time) {
        newErrors[`time-${index}`] = "Both times are required";
        isValid = false;
      } else if (!start?.isValid() || !end?.isValid()) {
        newErrors[`time-${index}`] = "Invalid time format (HH:mm)";
        isValid = false;
      } else if (end.isSameOrBefore(start)) {
        newErrors[`time-${index}`] = "End time must be after start";
        isValid = false;
      } else {
        // Calculate duration
        const duration = end.diff(start, "minutes");
        if (duration < 15) {
          newErrors[`time-${index}`] = "Minimum duration is 15 minutes";
          isValid = false;
        }
        
        // Add to time ranges for overlap check
        timeRanges.push({ start, end, index });
        totalHours += duration / 60;
      }
    });

    // Check for overlaps
    timeRanges.sort((a, b) => a.start - b.start);
    for (let i = 1; i < timeRanges.length; i++) {
      const prev = timeRanges[i - 1];
      const current = timeRanges[i];
      
      if (current.start.isBefore(prev.end)) {
        newErrors[`time-${prev.index}`] = "Overlaps with another time slot";
        newErrors[`time-${current.index}`] = "Overlaps with another time slot";
        isValid = false;
      }
    }

    // Validate total hours
    if (totalHours <= 0) {
      newErrors.total = "Total hours must be greater than 0";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Submit timesheet
  const handleSubmit = async (status = "Pending") => {
    if (!validateForm()) {
      toast.error("Please fix the errors in your timesheet");
      return;
    }

    setIsSubmitting(true);
    setApiErrors({});
    
    try {
      // Format time slots to match API requirements
      const formattedSlots = timeSlots.map(slot => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        description: slot.description
      }));

      const payload = {
        date: selectedDate,
        time_slots: formattedSlots,
        status: status
      };

      let response;
      if (timesheet) {
        // For update, include the timesheet ID
        response = await api.put("/employee/update-timesheet", {
          ...payload,
          id: timesheet.id
        });
      } else {
        response = await api.post("/employee/add-timesheet", payload);
      }
      
      toast.success(response.data.message || "Timesheet saved successfully");
      await fetchTimesheetData();
      setEditMode(false);
    } catch (error) {
      console.error("Submission Error:", error);
      
      let errorMessage = "Submission failed. Please try again.";
      let fieldErrors = {};
      
      if (error.response) {
        if (error.response.status === 400 && error.response.data.errors) {
          errorMessage = "Please fix the following errors:";
          fieldErrors = error.response.data.errors;
          
          // Display field-specific errors
          const newErrors = {};
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            // Convert backend field names to frontend format
            if (field.startsWith("time_slots")) {
              const match = field.match(/time_slots\[(\d+)\]\.(\w+)/);
              if (match) {
                const index = match[1];
                const fieldName = match[2];
                newErrors[`${fieldName}-${index}`] = Array.isArray(messages) ? messages.join(', ') : messages;
              }
            } else {
              newErrors[field] = Array.isArray(messages) ? messages.join(', ') : messages;
            }
          });
          setErrors(newErrors);
        } 
        else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      
      setApiErrors(prev => ({
        ...prev,
        submitError: errorMessage
      }));
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get first and last task times with proper validation
  const getFirstLastTaskTimes = () => {
    if (!timesheet || !timesheet.tasks || timesheet.tasks.length === 0) {
      return { firstTask: "--:--", lastTask: "--:--" };
    }
    
    // Filter and validate tasks
    const validTasks = timesheet.tasks.filter(task => 
      parseTime(task.start_time)?.isValid() && parseTime(task.end_time)?.isValid()
    );
    
    if (validTasks.length === 0) {
      return { firstTask: "--:--", lastTask: "--:--" };
    }
    
    // Sort by start time
    const sortedTasks = [...validTasks].sort((a, b) => 
      parseTime(a.start_time) - parseTime(b.start_time)
    );
    
    return {
      firstTask: formatTimeDisplay(sortedTasks[0].start_time),
      lastTask: formatTimeDisplay(sortedTasks[sortedTasks.length - 1].end_time)
    };
  };

  const { firstTask, lastTask } = getFirstLastTaskTimes();

  // Render time slot rows
  const renderTimeSlotRows = () => {
    return timeSlots.map((slot, index) => {
      const duration = calculateDuration(slot.start_time, slot.end_time);
      const hasError = errors[`time-${index}`] || errors[`description-${index}`];
      
      return (
        <tr key={index} className={hasError ? "table-warning" : ""}>
          <td>
            {editMode ? (
              <Form.Group controlId={`startTime-${index}`}>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Format: HH:mm (24-hour clock)</Tooltip>}
                >
                  <Form.Control
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleTimeSlotChange(index, "start_time", e.target.value)}
                    isInvalid={!!errors[`time-${index}`]}
                    size="sm"
                  />
                </OverlayTrigger>
              </Form.Group>
            ) : (
              <span className={!slot.start_time ? "text-danger" : ""}>
                {formatTimeDisplay(slot.start_time)}
              </span>
            )}
          </td>
          <td>
            {editMode ? (
              <Form.Group controlId={`endTime-${index}`}>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Must be after start time</Tooltip>}
                >
                  <Form.Control
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleTimeSlotChange(index, "end_time", e.target.value)}
                    isInvalid={!!errors[`time-${index}`]}
                    size="sm"
                  />
                </OverlayTrigger>
                {errors[`time-${index}`] && (
                  <Form.Text className="text-danger d-block">
                    {errors[`time-${index}`]}
                  </Form.Text>
                )}
              </Form.Group>
            ) : (
              <span className={!slot.end_time ? "text-danger" : ""}>
                {formatTimeDisplay(slot.end_time)}
              </span>
            )}
          </td>
          <td>{duration} hrs</td>
          <td>
            {editMode ? (
              <Form.Group controlId={`description-${index}`}>
                <Form.Control
                  as="textarea"
                  rows={1}
                  placeholder="Describe your task..."
                  value={slot.description}
                  onChange={(e) => handleTimeSlotChange(index, "description", e.target.value)}
                  isInvalid={!!errors[`description-${index}`]}
                  size="sm"
                />
                {errors[`description-${index}`] && (
                  <Form.Text className="text-danger">
                    {errors[`description-${index}`]}
                  </Form.Text>
                )}
              </Form.Group>
            ) : (
              slot.description || <span className="text-danger">No description</span>
            )}
          </td>
          {editMode && (
            <td className="text-center align-middle">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeTimeSlot(index)}
                disabled={timeSlots.length <= 1}
                title="Remove time slot"
              >
                <FaTrash />
              </Button>
            </td>
          )}
        </tr>
      );
    });
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <Row className="mb-4">
      <Col xl={3} md={6} className="mb-3">
        <Card className="border-start-primary shadow h-100 py-2">
          <Card.Body>
            <Row className="align-items-center">
              <Col className="mr-2">
                <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                  Weekly Hours
                </div>
                <div className="h5 mb-0 fw-bold text-gray-800">
                  {summaryData?.weekly_total || 0} hrs
                </div>
              </Col>
              <Col className="col-auto">
                <div className="bg-primary text-white rounded-circle p-3">
                  <FaChartLine size="1.5em" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
      
      <Col xl={3} md={6} className="mb-3">
        <Card className="border-start-success shadow h-100 py-2">
          <Card.Body>
            <Row className="align-items-center">
              <Col className="mr-2">
                <div className="text-xs fw-bold text-success text-uppercase mb-1">
                  Weekly Average
                </div>
                <div className="h5 mb-0 fw-bold text-gray-800">
                  {summaryData?.weekly_avg || 0} hrs/day
                </div>
              </Col>
              <Col className="col-auto">
                <div className="bg-success text-white rounded-circle p-3">
                  <FaTasks size="1.5em" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
      
      <Col xl={3} md={6} className="mb-3">
        <Card className="border-start-info shadow h-100 py-2">
          <Card.Body>
            <Row className="align-items-center">
              <Col className="mr-2">
                <div className="text-xs fw-bold text-info text-uppercase mb-1">
                  Monthly Hours
                </div>
                <div className="h5 mb-0 fw-bold text-gray-800">
                  {summaryData?.monthly_total || 0} hrs
                </div>
              </Col>
              <Col className="col-auto">
                <div className="bg-info text-white rounded-circle p-3">
                  <FaCalendarAlt size="1.5em" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
      
      <Col xl={3} md={6} className="mb-3">
        <Card className="border-start-warning shadow h-100 py-2">
          <Card.Body>
            <Row className="align-items-center">
              <Col className="mr-2">
                <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                  Today's Hours
                </div>
                <div className="h5 mb-0 fw-bold text-gray-800">
                  {timesheet ? timesheet.total_hours : totalHours} hrs
                </div>
              </Col>
              <Col className="col-auto">
                <div className="bg-warning text-white rounded-circle p-3">
                  <FaBusinessTime size="1.5em" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  return (
    <Container fluid className="p-4 bg-light" style={{ minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <div className="d-flex align-items-center">
            <div className="bg-primary text-white p-3 rounded-circle me-3">
              <FaBusinessTime size="1.5em" />
            </div>
            <div>
              <h1 className="h3 mb-0 text-gray-800 fw-bold">
                Flexible Timesheet
              </h1>
              <p className="mb-0 text-muted">
                Track your work hours anytime throughout the day
              </p>
            </div>
          </div>
        </Col>
        
        <Col md={6} className="d-flex justify-content-end mt-3 mt-md-0">
          <Dropdown>
            <Dropdown.Toggle 
              variant="primary" 
              id="date-dropdown"
              className="d-flex align-items-center fw-bold"
            >
              <FaCalendarAlt className="me-2" />
              {formattedDate}
              <FaChevronDown className="ms-2" />
            </Dropdown.Toggle>
            
            <Dropdown.Menu>
              <Dropdown.Item 
                onClick={() => setSelectedDate(today)}
                className="d-flex align-items-center"
              >
                <span className="me-2">Today</span>
                <Badge pill bg="primary">
                  {moment().format("MMM D")}
                </Badge>
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setSelectedDate(moment().subtract(1, 'day').format("YYYY-MM-DD"))}
                className="d-flex align-items-center"
              >
                <span className="me-2">Yesterday</span>
                <Badge pill bg="secondary">
                  {moment().subtract(1, 'day').format("MMM D")}
                </Badge>
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setShowDatePicker(true)}>
                Select Custom Date
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
      
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading timesheet data...</p>
        </div>
      ) : (
        <>
          {apiErrors.fetchError && (
            <Alert variant="danger" className="mb-4">
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                <div>
                  <h5>Failed to load data</h5>
                  <p className="mb-0">{apiErrors.fetchError}</p>
                </div>
              </div>
              <Button 
                variant="outline-primary" 
                className="mt-3"
                onClick={fetchTimesheetData}
              >
                <FaSyncAlt className="me-2" /> Retry
              </Button>
            </Alert>
          )}
          
          {summaryData && renderSummaryCards()}
          
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Timesheet for {formattedDate}
              </h5>
              <Badge 
                pill 
                bg={timesheet?.status ? statusVariants[timesheet.status] : "secondary"} 
                className="px-3 py-2"
              >
                {timesheet?.status ? statusIcons[timesheet.status] : <FaHistory />} 
                {timesheet?.status || "Not Submitted"}
              </Badge>
            </Card.Header>
            
            <Card.Body>
              {/* Show "No Timesheet" message for historical dates without data */}
              {!hasTimesheetData && !isToday && (
                <div className="text-center py-5">
                  <FaHistory className="text-secondary mb-3" size="3em" />
                  <h5 className="mb-2">No Timesheet Recorded</h5>
                  <p className="text-muted mb-4">
                    There is no timesheet data available for {formattedDate}
                  </p>
                  <Button 
                    variant="outline-primary"
                    onClick={() => setSelectedDate(today)}
                  >
                    <FaCalendarAlt className="me-2" />
                    Go to Today's Timesheet
                  </Button>
                </div>
              )}

              {/* Show timesheet data or creation form */}
              {(hasTimesheetData || isToday) && (
                <>
                  <div className="d-flex flex-wrap mb-4 p-3 bg-light rounded">
                    <div className="d-flex align-items-center me-4 mb-2 mb-md-0">
                      <FaRegClock className="text-primary me-2" />
                      <span className="fw-bold me-1">First Task:</span>
                      <span>{firstTask}</span>
                    </div>
                    
                    <div className="d-flex align-items-center me-4 mb-2 mb-md-0">
                      <FaRegClock className="text-primary me-2" />
                      <span className="fw-bold me-1">Last Task:</span>
                      <span>{lastTask}</span>
                    </div>
                    
                    <div className="d-flex align-items-center">
                      <FaChartLine className="text-primary me-2" />
                      <span className="fw-bold me-1">Total:</span>
                      <span>{timesheet ? timesheet.total_hours : totalHours} hrs</span>
                    </div>
                  </div>
                  
                  {apiErrors.submitError && (
                    <Alert variant="danger" className="mb-3">
                      {apiErrors.submitError}
                    </Alert>
                  )}
                  
                  {errors.total && (
                    <Alert variant="danger" className="mb-3">
                      {errors.total}
                    </Alert>
                  )}
                  
                  <Table bordered responsive className="mb-4">
                    <thead className="table-light">
                      <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Task Description</th>
                        {editMode && <th style={{ width: "80px" }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {renderTimeSlotRows()}
                    </tbody>
                    <tfoot>
                      <tr className="fw-bold">
                        <td colSpan={2} className="text-end">Total Hours:</td>
                        <td>{timesheet ? timesheet.total_hours : totalHours} hrs</td>
                        <td colSpan={editMode ? 1 : 0}>
                          {editMode && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={addTimeSlot}
                            >
                              <FaPlus className="me-1" /> Add Slot
                            </Button>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    {!isToday ? (
                      <Alert variant="info" className="mb-0 d-flex align-items-center">
                        <FaInfoCircle className="me-2" />
                        Viewing historical timesheet - not editable
                      </Alert>
                    ) : timesheet?.status === "Approved" ? (
                      <Alert variant="success" className="mb-0 d-flex align-items-center">
                        <FaCheckCircle className="me-2" />
                        This timesheet has been approved and can no longer be edited.
                      </Alert>
                    ) : editMode ? (
                      <>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-secondary"
                            onClick={() => {
                              setEditMode(false);
                              fetchTimesheetData();
                            }}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="secondary"
                            onClick={() => handleSubmit("Draft")}
                            disabled={isSubmitting}
                          >
                            Save as Draft
                          </Button>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => handleSubmit("Pending")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Timesheet"
                          )}
                        </Button>
                      </>
                    ) : (
                      isEditable && (
                        <Button
                          variant="primary"
                          onClick={() => setEditMode(true)}
                        >
                          <FaEdit className="me-2" />
                          {timesheet ? "Edit Timesheet" : "Create Timesheet"}
                        </Button>
                      )
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Weekly Progress */}
          {isToday && summaryData && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-light d-flex align-items-center">
                <FaChartBar className="me-2 text-primary" />
                <strong>Weekly Progress</strong>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Weekly Target: 40 hours</span>
                  <span>
                    {summaryData.weekly_total} hrs / 40 hrs
                  </span>
                </div>
                <ProgressBar 
                  now={(summaryData.weekly_total / 40) * 100} 
                  variant={summaryData.weekly_total >= 40 ? "success" : "primary"}
                  label={`${summaryData.weekly_total} hrs`}
                  className="mb-3"
                  style={{ height: "25px" }}
                />
                <div className="d-flex justify-content-between small text-muted">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
      
      {/* Date Picker Modal */}
      <Modal show={showDatePicker} onHide={() => setShowDatePicker(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Select Date</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Choose Date</Form.Label>
            <Form.Control
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setShowDatePicker(false);
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TimesheetPage;