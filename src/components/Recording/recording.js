import React, { useEffect, useState } from "react";
import api from "../../api/api";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import {
  FaVideo,
  FaClock,
  FaTasks,
  FaCalendarAlt,
  FaEllipsisV,
  FaPlayCircle,
  FaFilePdf
} from "react-icons/fa";
import { Badge, Dropdown, Button, Card, Table, Spinner, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

const MeetingRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState("");

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwtToken");
        const response = await api.get("/employee/get-recording", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecordings(response.data);
      } catch (err) {
        setError("Failed to fetch recordings");
        toast.error("Error loading meeting recordings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  const handlePlayVideo = (videoUrl) => {
    setCurrentVideo(videoUrl);
    setShowVideoModal(true);
  };

  const handleDownloadPdf = (pdfUrl) => {
    window.open(pdfUrl, "_blank");
  };

  const formatDate = (dateString) => {
    return moment(dateString, "DD/MM/YYYY").format("ddd, MMM Do YYYY");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: "500px" }}>
        {error}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="mt-5 shadow-sm">
        <Card.Body className="text-center py-5">
          <FaVideo size={48} className="text-muted mb-3" />
          <h4>No Recordings Available</h4>
          <p className="text-muted">You don't have any meeting recordings yet</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="container-fluid py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Meeting Recordings</h2>
        <Badge pill bg="primary">
          {recordings.length} {recordings.length > 1 ? "Recordings" : "Recording"}
        </Badge>
      </div>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th style={{ width: "25%" }}>Meeting</th>
                <th>Description</th>
                <th>Date & Time</th>
                <th>Resources</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recordings.map((recording) => (
                <tr key={recording.recording_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary rounded p-2 me-3">
                        <FaVideo className="text-white" />
                      </div>
                      <div>
                        <strong>{recording.title}</strong>
                        <div className="text-muted small mt-1">
                          <FaTasks className="me-1" size={12} />
                          {recording.day}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="mb-0">{recording.description}</p>
                    <small className="text-muted">ID: {recording.meeting_record_id}</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div>
                          <FaCalendarAlt className="me-2 text-primary" />
                          {formatDate(recording.date_time)}
                        </div>
                        <div className="mt-1">
                          <FaClock className="me-2 text-primary" />
                          {moment(recording.created_at, "DD/MM/YYYY HH:mm").format("h:mm A")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2 d-flex align-items-center"
                        onClick={() => handlePlayVideo(recording.video_url)}
                      >
                        <FaPlayCircle className="me-1" />
                        Video
                      </Button>
                      {recording.Pdf_url && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDownloadPdf(recording.Pdf_url)}
                        >
                          <FaFilePdf className="me-1" />
                          PDF
                        </Button>
                      )}
                    </div>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" size="sm" id="dropdown-basic">
                        <FaEllipsisV />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handlePlayVideo(recording.video_url)}>
                          Play Video
                        </Dropdown.Item>
                        {recording.Pdf_url && (
                          <Dropdown.Item onClick={() => handleDownloadPdf(recording.Pdf_url)}>
                            Download PDF
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item>Share</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger">Delete</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Video Modal */}
      <Modal
        show={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Meeting Recording</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="ratio ratio-16x9">
            <iframe
              src={currentVideo.replace("/view", "/preview")}
              title="Meeting Recording"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVideoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MeetingRecordings;