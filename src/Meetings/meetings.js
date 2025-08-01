import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./Meetings.css";

import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import {
  FaVideo,
  FaClock,
  FaTasks,
  FaCalendarAlt,
  FaEllipsisV,
  FaPlayCircle
} from "react-icons/fa";
import { Badge, Dropdown, Button, Card, Table, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./Meetings.css";

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    virtual: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date from backend (DD-MM-YYYY HH:mm) to display format
  const formatMeetingDate = (dateString) => {
    return moment(dateString, "DD-MM-YYYY HH:mm").format("MMM D, YYYY h:mm A");
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${minutes}min`;
  };

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/employee/get-meetings");
      
      if (response.data?.meetings) {
        const meetingData = response.data.meetings;
        setMeetings(meetingData.filter(meeting => meeting.status !== "Completed"));
        
        // Calculate statistics
        setStats({
          total: meetingData.length,
          scheduled: meetingData.filter(m => m.status === "Scheduled").length,
          virtual: meetingData.filter(m => m.meeting_type === "Virtual").length
        });
      }
    } catch (err) {
      setError("Failed to load meetings");
      toast.error("❌ Failed to load meetings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Handle meeting actions
  // Add default case to switch statement
const handleMeetingAction = (action, meeting) => {
  switch (action) {
    case "join":
      window.open(meeting.link, "_blank");
      toast.info("Joining meeting...");
      break; // Add break
    default: // Add default case
      toast.warn("Unknown action");
      break;
  }
};

  // Refresh meetings data
  const handleRefresh = () => {
    fetchMeetings();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error} 
        <Button variant="link" onClick={fetchMeetings} className="ms-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Meetings</h2>
        <Button variant="outline-primary" onClick={handleRefresh}>
          <FaClock className="me-2" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{stats.total}</h5>
                  <small className="text-muted">Total Meetings</small>
                </div>
                <div className="icon-circle bg-primary text-white">
                  <FaTasks size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{stats.scheduled}</h5>
                  <small className="text-muted">Scheduled</small>
                </div>
                <div className="icon-circle bg-info text-white">
                  <FaClock size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{stats.virtual}</h5>
                  <small className="text-muted">Virtual Meetings</small>
                </div>
                <div className="icon-circle bg-success text-white">
                  <FaVideo size={20} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Meetings Table */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>S.No</th>
                <th>Meeting Title</th>
                <th>Description</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No upcoming meetings scheduled
                  </td>
                </tr>
              ) : (
                meetings.map((meeting, index) => (
                  <tr key={meeting.meeting_id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="fw-semibold">{meeting.title}</div>
                      <small className="text-muted">{meeting.agenda}</small>
                    </td>
                    <td>{meeting.description}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-primary" />
                        {formatMeetingDate(meeting.date_time)}
                      </div>
                    </td>
                    <td>{formatDuration(meeting.duration_minutes)}</td>
                    <td>
                      <Badge 
                        bg={meeting.meeting_type === "Virtual" ? "success" : "primary"}
                        className="text-capitalize"
                      >
                        {meeting.meeting_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge 
                        bg={meeting.status === "Scheduled" ? "info" : "warning"}
                        className="text-capitalize"
                      >
                        {meeting.status}
                      </Badge>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" id="dropdown-basic">
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item 
                            onClick={() => handleMeetingAction("join", meeting)}
                            disabled={meeting.status !== "Scheduled"}
                          >
                            <FaPlayCircle className="me-2 text-success" /> Join Meeting
                          </Dropdown.Item>
                          
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Meetings;