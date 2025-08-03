import React, { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Form, Button, 
  Table, Dropdown, Badge, ProgressBar, Modal,
  Alert, Spinner
} from "react-bootstrap";
import { 
  FaCheckCircle, FaTasks, FaSyncAlt, 
  FaChevronDown, FaExclamationTriangle, FaPlus, 
  FaTrash, FaEdit, FaCalendarAlt, FaChartLine,
  FaHourglassHalf, FaRegClock, FaRegCalendarAlt,
  FaBusinessTime
} from "react-icons/fa";
import moment from "moment";
import { ToastContainer, toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

const TimeSheet = () => {
  // State Management
  const [timesheet, setTimesheet] = useState({
    date: moment().format("YYYY-MM-DD"),
    time_slots: [
      { start_time: "09:00", end_time: "17:00", description: "Work hours" }
    ]
  });
  const [summary, setSummary] = useState({
    weekly_total: 0,
    weekly_avg: 0,
    monthly_total: 0,
    monthly_avg: 0
  });
  const [dailyData, setDailyData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [canAddMore, setCanAddMore] = useState(true);

  // Status badge variants
  const statusVariants = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger"
  };

  // Status icons
  const statusIcons = {
    Pending: <FaHourglassHalf />,
    Approved: <FaCheckCircle />,
    Rejected: <FaExclamationTriangle />
  };

  // Calculate total hours whenever timeslots change
  useEffect(() => {
    if (isEditing) {
      let totalMinutes = 0;
      timesheet.time_slots.forEach(slot => {
        const start = moment(slot.start_time, "HH:mm");
        const end = moment(slot.end_time, "HH:mm");
        if (start.isValid() && end.isValid()) {
          totalMinutes += end.diff(start, "minutes");
        }
      });
      const calculatedHours = parseFloat((totalMinutes / 60).toFixed(2));
      setTotalHours(calculatedHours);
      setCanAddMore(calculatedHours < 8);
    } else if (dailyData) {
      const hours = parseFloat(dailyData.total_hours);
      setTotalHours(hours);
      setCanAddMore(hours < 8);
    } else {
      setTotalHours(0);
      setCanAddMore(true);
    }
  }, [timesheet.time_slots, isEditing, dailyData]);

  // Fetch timesheet data on mount and date change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dailyRes, summaryRes] = await Promise.all([
          api.get("/employee/daily/get-timesheet", {
            params: { date: timesheet.date }
          }),
          api.get("/employee/summary/get-timesheet")
        ]);
        
        setDailyData(dailyRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setDailyData(null);
        } else {
          toast.error("Failed to load timesheet data");
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timesheet.date]);

  // Reset editing state when date changes
  useEffect(() => {
    setIsEditing(false);
  }, [timesheet.date]);

  // Handle timeslot changes
  const handleSlotChange = (index, field, value) => {
    const updatedSlots = [...timesheet.time_slots];
    updatedSlots[index][field] = value;
    
    // Auto-adjust subsequent slots if end time changes
    if (field === "end_time" && index < updatedSlots.length - 1) {
      const currentEnd = moment(value, "HH:mm");
      const nextStart = moment(updatedSlots[index + 1].start_time, "HH:mm");
      
      if (nextStart.isBefore(currentEnd)) {
        updatedSlots[index + 1].start_time = currentEnd.add(1, 'minute').format("HH:mm");
      }
    }
    
    setTimesheet(prev => ({ ...prev, time_slots: updatedSlots }));
  };

  // Add new timeslot only if total hours < 8
  const addTimeSlot = () => {
    if (!canAddMore) {
      toast.warning("You have reached 8 hours. Cannot add more time slots.");
      return;
    }
    
    const lastSlot = timesheet.time_slots[timesheet.time_slots.length - 1];
    const lastEndTime = lastSlot ? moment(lastSlot.end_time, "HH:mm") : moment("09:00", "HH:mm");
    
    setTimesheet(prev => ({
      ...prev,
      time_slots: [
        ...prev.time_slots,
        {
          start_time: lastEndTime.format("HH:mm"),
          end_time: lastEndTime.add(30, 'minutes').format("HH:mm"),
          description: ""
        }
      ]
    }));
  };

  // Remove timeslot
  const removeTimeSlot = (index) => {
    if (timesheet.time_slots.length <= 1) return;
    const updatedSlots = [...timesheet.time_slots];
    updatedSlots.splice(index, 1);
    setTimesheet(prev => ({ ...prev, time_slots: updatedSlots }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const today = moment().format("YYYY-MM-DD");
    
    // Validate date (only today allowed for submission)
    if (timesheet.date !== today) {
      errors.date = "You can only submit timesheets for today";
    }
    
    // Validate timeslots
    timesheet.time_slots.forEach((slot, index) => {
      const start = moment(slot.start_time, "HH:mm");
      const end = moment(slot.end_time, "HH:mm");
      
      if (!start.isValid()) errors[`slot_start_${index}`] = "Invalid start time";
      if (!end.isValid()) errors[`slot_end_${index}`] = "Invalid end time";
      if (end.isBefore(start)) errors[`slot_end_${index}`] = "End time must be after start";
      if (!slot.description.trim()) errors[`slot_desc_${index}`] = "Description required";
      
      // Calculate duration
      const duration = end.diff(start, "minutes");
      if (duration <= 0) errors[`slot_duration_${index}`] = "Invalid time duration";
      
      // Check for overlapping slots
      if (index > 0) {
        const prevEnd = moment(timesheet.time_slots[index-1].end_time, "HH:mm");
        if (start.isBefore(prevEnd)) {
          errors[`slot_start_${index}`] = "Overlaps with previous time slot";
        }
      }
    });
    
    // Validate total hours (8 hours = 480 minutes)
    if (totalHours < 7.9) {
      errors.total = `Total hours (${totalHours.toFixed(2)}) must be at least 8 hours`;
    } else if (totalHours > 12) {
      errors.total = `Total hours (${totalHours.toFixed(2)}) cannot exceed 12 hours`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit timesheet
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      toast.error("Please fix form errors");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Calculate earliest start and latest end for the day
      const startTimes = timesheet.time_slots.map(slot => 
        moment(slot.start_time, "HH:mm")
      );
      const endTimes = timesheet.time_slots.map(slot => 
        moment(slot.end_time, "HH:mm")
      );
      
      const earliestStart = moment.min(startTimes).format("HH:mm");
      const latestEnd = moment.max(endTimes).format("HH:mm");
      
      const payload = {
        login_time: `${timesheet.date}T${earliestStart}:00`,
        logout_time: `${timesheet.date}T${latestEnd}:00`,
        time_slots: timesheet.time_slots.map(slot => ({
          start_time: `${timesheet.date}T${slot.start_time}:00`,
          end_time: `${timesheet.date}T${slot.end_time}:00`,
          description: slot.description
        }))
      };
      
      let res;
      if (dailyData) {
        // Update existing timesheet
        payload.date = timesheet.date;
        res = await api.put("/employee/update-timesheet", payload);
      } else {
        // Create new timesheet
        res = await api.post("/employee/add-timesheet", payload);
      }
      
      toast.success(res.data.message);
      
      // Refresh data
      const [dailyRes, summaryRes] = await Promise.all([
        api.get("/employee/daily/get-timesheet", { params: { date: timesheet.date } }),
        api.get("/employee/summary/get-timesheet")
      ]);
      
      setDailyData(dailyRes.data);
      setSummary(summaryRes.data);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing existing timesheet
  const startEditing = () => {
    if (!dailyData) return;
    
    setTimesheet({
      date: dailyData.date,
      time_slots: dailyData.tasks.map(task => ({
        start_time: task.start_time,
        end_time: task.end_time,
        description: task.description
      }))
    });
    
    setIsEditing(true);
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    return Math.min(100, (totalHours / 8) * 100);
  };

  // Get progress variant
  const getProgressVariant = () => {
    if (totalHours >= 8) return "success";
    if (totalHours >= 6) return "info";
    return "warning";
  };

  // Render time slot inputs
  const renderTimeSlots = () => (
    timesheet.time_slots.map((slot, index) => {
      const start = moment(slot.start_time, "HH:mm");
      const end = moment(slot.end_time, "HH:mm");
      const duration = start.isValid() && end.isValid() 
        ? end.diff(start, "minutes") / 60 
        : 0;
      
      return (
        <div key={index} className="time-slot mb-3 p-3 border rounded bg-light position-relative">
          <div className="position-absolute top-0 start-0 bg-info text-white px-2 py-1 small rounded">
            {duration.toFixed(2)} hrs
          </div>
          
          <Row className="g-3 align-items-center mt-2">
            <Col md={3}>
              <Form.Group controlId={`startTime-${index}`}>
                <Form.Label className="fw-bold text-secondary">Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => handleSlotChange(index, "start_time", e.target.value)}
                  isInvalid={!!validationErrors[`slot_start_${index}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`slot_start_${index}`]}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group controlId={`endTime-${index}`}>
                <Form.Label className="fw-bold text-secondary">End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => handleSlotChange(index, "end_time", e.target.value)}
                  isInvalid={!!validationErrors[`slot_end_${index}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`slot_end_${index}`]}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={5}>
              <Form.Group controlId={`description-${index}`}>
                <Form.Label className="fw-bold text-secondary">Task Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  placeholder="Describe your task..."
                  value={slot.description}
                  onChange={(e) => handleSlotChange(index, "description", e.target.value)}
                  isInvalid={!!validationErrors[`slot_desc_${index}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`slot_desc_${index}`]}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={1} className="d-flex align-items-end">
              <Button 
                variant="outline-danger" 
                onClick={() => removeTimeSlot(index)}
                disabled={timesheet.time_slots.length <= 1}
                className="mt-3"
              >
                <FaTrash />
              </Button>
            </Col>
          </Row>
        </div>
      );
    })
  );

  // Render timesheet summary cards
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
                  {summary.weekly_total} hrs
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
                  {summary.weekly_avg} hrs/day
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
                  {summary.monthly_total} hrs
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
                  Today's Progress
                </div>
                <div className="h5 mb-0 fw-bold text-gray-800">
                  {totalHours.toFixed(2)}/8 hrs
                </div>
                <ProgressBar 
                  now={calculateProgress()} 
                  variant={getProgressVariant()}
                  className="mt-2"
                  animated={dailyData?.status === "Pending"}
                  striped={dailyData?.status === "Pending"}
                />
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

  // Render daily timesheet content
  const renderDailyContent = () => {
    const today = moment().format("YYYY-MM-DD");
    const isToday = timesheet.date === today;
    const isEndOfDay = moment().isAfter(moment().endOf('day'));
    
    if (isEditing) {
      return (
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group controlId="datePicker">
                <Form.Label className="fw-bold text-secondary">Date</Form.Label>
                <Form.Control
                  type="date"
                  value={timesheet.date}
                  onChange={(e) => setTimesheet(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  disabled={dailyData}
                  isInvalid={!!validationErrors.date}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={9} className="d-flex align-items-end gap-2">
              <Button 
                variant="success" 
                className="flex-grow-1 fw-bold"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSyncAlt className="mr-2 fa-spin" />
                    Processing...
                  </>
                ) : dailyData ? "Update Timesheet" : "Submit Timesheet"}
              </Button>
              <Button 
                variant="outline-secondary" 
                className="fw-bold"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Col>
          </Row>
          
          {validationErrors.total && (
            <Alert variant="danger" className="mb-3">
              {validationErrors.total}
            </Alert>
          )}
          
          <h5 className="mb-3 text-gray-800 fw-bold d-flex align-items-center">
            <FaTasks className="mr-2 text-primary" /> Time Slots
          </h5>
          
          {renderTimeSlots()}
          
          <div className="d-flex justify-content-between align-items-center mt-3">
            <Button 
              variant="outline-primary" 
              onClick={addTimeSlot}
              className="fw-bold"
              disabled={!canAddMore}
            >
              <FaPlus className="mr-1" /> Add Time Slot
            </Button>
            
            <div className="fw-bold text-primary">
              Total Hours: {totalHours.toFixed(2)} / 8
            </div>
          </div>
        </Form>
      );
    }
    
    if (dailyData) {
      const isFullShift = totalHours >= 8;
      const statusVariant = statusVariants[dailyData.status] || "secondary";
      
      // Calculate earliest start and latest end
      const startTimes = dailyData.tasks.map(task => 
        moment(task.start_time, "HH:mm")
      );
      const endTimes = dailyData.tasks.map(task => 
        moment(task.end_time, "HH:mm")
      );
      
      const earliestStart = moment.min(startTimes).format("HH:mm");
      const latestEnd = moment.max(endTimes).format("HH:mm");
      
      return (
        <>
          <div className="d-flex flex-wrap align-items-center mb-4 p-3 bg-light rounded">
            <div className="d-flex align-items-center me-4 mb-2 mb-md-0">
              <FaRegClock className="text-primary me-2" />
              <span className="fw-bold me-1">Earliest Start:</span>
              <span>{earliestStart}</span>
            </div>
            
            <div className="d-flex align-items-center me-4 mb-2 mb-md-0">
              <FaRegClock className="text-primary me-2" />
              <span className="fw-bold me-1">Latest End:</span>
              <span>{latestEnd}</span>
            </div>
            
            <div className="d-flex align-items-center me-4 mb-2 mb-md-0">
              <FaRegCalendarAlt className="text-primary me-2" />
              <span className="fw-bold me-1">Status:</span>
              <Badge pill bg={statusVariant} className="px-3 py-2">
                {statusIcons[dailyData.status]} {dailyData.status}
              </Badge>
            </div>
            
            <div className="d-flex align-items-center">
              <FaChartLine className="text-primary me-2" />
              <span className="fw-bold me-1">Total:</span>
              <span>{totalHours.toFixed(2)} hrs</span>
            </div>
          </div>
          
          <Table striped bordered hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Task Description</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.tasks.map((task, index) => {
                const start = moment(task.start_time, "HH:mm");
                const end = moment(task.end_time, "HH:mm");
                const duration = end.diff(start, "minutes") / 60;
                
                return (
                  <tr key={index}>
                    <td>{task.start_time}</td>
                    <td>{task.end_time}</td>
                    <td>{duration.toFixed(2)} hrs</td>
                    <td>{task.description}</td>
                  </tr>
                );
              })}
              <tr className="fw-bold">
                <td colSpan="2" className="text-end">Total Hours:</td>
                <td>{totalHours.toFixed(2)} hrs</td>
                <td>
                  {isFullShift ? (
                    <Badge pill bg="success" className="px-3 py-2">
                      Full Shift Completed
                    </Badge>
                  ) : (
                    <Badge pill bg="warning" className="px-3 py-2">
                      <FaExclamationTriangle className="mr-1" />
                      Partial Shift ({(8 - totalHours).toFixed(2)} hrs short)
                    </Badge>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>
          
          {isToday && !isEndOfDay && dailyData.status === "Pending" && (
            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" onClick={startEditing} className="fw-bold">
                <FaEdit className="mr-1" /> Edit Timesheet
              </Button>
            </div>
          )}
          
          {dailyData.status === "Pending" && (
            <Alert variant="warning" className="mt-3">
              <FaExclamationTriangle className="me-2" />
              Your timesheet is pending approval. You can edit it until the end of the day.
            </Alert>
          )}
        </>
      );
    }
    
    return (
      <>
        <div className="text-center py-5">
          <FaTasks className="text-muted mb-3" size="3em" />
          <h5 className="text-muted mb-3">No timesheet recorded for this day</h5>
          {isToday && !isEndOfDay && (
            <Button 
              variant="primary" 
              onClick={() => setIsEditing(true)}
              className="fw-bold"
            >
              <FaPlus className="mr-1" /> Create Timesheet
            </Button>
          )}
        </div>
      </>
    );
  };

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
                Track your work hours (8 hours required daily)
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
              {moment(timesheet.date).format("MMMM D, YYYY")}
              <FaChevronDown className="ms-2" />
            </Dropdown.Toggle>
            
            <Dropdown.Menu>
              <Dropdown.Item 
                onClick={() => setTimesheet(prev => ({
                  ...prev,
                  date: moment().format("YYYY-MM-DD")
                }))}
                className="d-flex align-items-center"
              >
                <span className="me-2">Today</span>
                <Badge pill bg="primary">
                  {moment().format("MMM D")}
                </Badge>
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setTimesheet(prev => ({
                  ...prev,
                  date: moment().subtract(1, 'day').format("YYYY-MM-DD")
                }))}
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
          {renderSummaryCards()}
          
          {/* Timesheet Card */}
          <Card className="shadow mb-4 border-0">
            <Card.Header className="py-3 d-flex justify-content-between align-items-center bg-white border-0">
              <h6 className="m-0 fw-bold text-primary">
                {moment(timesheet.date).format("MMMM D, YYYY")} Timesheet
              </h6>
              <div className="d-flex align-items-center">
                {timesheet.date === moment().format("YYYY-MM-DD") && 
                 !isEditing && 
                 !dailyData && (
                  <Button 
                    variant="primary" 
                    onClick={() => setIsEditing(true)}
                    className="fw-bold"
                  >
                    <FaPlus className="me-1" /> Create Timesheet
                  </Button>
                )}
              </div>
            </Card.Header>
            
            <Card.Body className="bg-white rounded">
              {renderDailyContent()}
            </Card.Body>
          </Card>
        </>
      )}
      
      {/* Custom Date Picker Modal */}
      <Modal show={showDatePicker} onHide={() => setShowDatePicker(false)}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Select Date</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Choose Date</Form.Label>
            <Form.Control
              type="date"
              value={timesheet.date}
              max={moment().format("YYYY-MM-DD")}
              onChange={(e) => {
                setTimesheet(prev => ({ ...prev, date: e.target.value }));
                setShowDatePicker(false);
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowDatePicker(false)}
          >
            Select Date
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TimeSheet;