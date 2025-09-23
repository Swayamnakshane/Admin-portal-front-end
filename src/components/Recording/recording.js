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
  FaFilePdf,
  FaExclamationTriangle
} from "react-icons/fa";
import { Badge, Dropdown, Button, Card, Table, Spinner, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

const MeetingRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState("");
  const [currentPdf, setCurrentPdf] = useState("");

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
    if (!videoUrl) {
      toast.error("Video URL not available");
      return;
    }

    try {
      // Directly use the video URL without any validation or transformation
      setCurrentVideo(videoUrl);
      setShowVideoModal(true);
    } catch (error) {
      console.error("Error processing video URL:", error);
      toast.error("Error loading video");
    }
  };

  const handlePdfAction = (pdfUrl) => {
    if (!pdfUrl) {
      toast.error("PDF URL not available");
      return;
    }

    setCurrentPdf(pdfUrl);
    setShowPdfModal(true);
  };

  const handleDownloadPdf = () => {
    if (currentPdf) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = currentPdf;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Extract filename from URL or use a default name
      const filename = currentPdf.split('/').pop() || 'meeting-document.pdf';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowPdfModal(false);
    }
  };

  const handleViewPdf = () => {
    if (currentPdf) {
      window.open(currentPdf, '_blank', 'noopener,noreferrer');
      setShowPdfModal(false);
    }
  };

  // Direct PDF download without modal
  const handleDirectPdfDownload = (pdfUrl) => {
    if (!pdfUrl) {
      toast.error("PDF URL not available");
      return;
    }

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = pdfUrl.split('/').pop() || 'meeting-document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct PDF view in new tab
  const handleDirectPdfView = (pdfUrl) => {
    if (!pdfUrl) {
      toast.error("PDF URL not available");
      return;
    }
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString) => {
    try {
      return moment(dateString, "DD/MM/YYYY").isValid() 
        ? moment(dateString, "DD/MM/YYYY").format("ddd, MMM Do YYYY")
        : dateString || "Date not available";
    } catch (error) {
      return dateString || "Date not available";
    }
  };

  const formatTime = (dateTimeString) => {
    try {
      return moment(dateTimeString, "DD/MM/YYYY HH:mm").isValid()
        ? moment(dateTimeString, "DD/MM/YYYY HH:mm").format("h:mm A")
        : dateTimeString || "Time not available";
    } catch (error) {
      return dateTimeString || "Time not available";
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading recordings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mx-auto mt-5" style={{ maxWidth: "500px" }}>
        <FaExclamationTriangle className="me-2" />
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
          {recordings.length} {recordings.length === 1 ? "Recording" : "Recordings"}
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
                <tr key={recording.recording_id || recording.meeting_record_id || recording.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary rounded p-2 me-3">
                        <FaVideo className="text-white" />
                      </div>
                      <div>
                        <strong>{recording.title || "Untitled Meeting"}</strong>
                        <div className="text-muted small mt-1">
                          <FaTasks className="me-1" size={12} />
                          {recording.day || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="mb-0">{recording.description || "No description available"}</p>
                    <small className="text-muted">ID: {recording.meeting_record_id || recording.recording_id || "N/A"}</small>
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
                          {formatTime(recording.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center"
                        onClick={() => handlePlayVideo(recording.video_url || recording.videoUrl || recording.video)}
                      >
                        <FaPlayCircle className="me-1" />
                        Video
                      </Button>
                      {(recording.Pdf_url || recording.pdf_url || recording.pdfUrl || recording.pdf) && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center"
                          onClick={() => handleDirectPdfView(recording.Pdf_url || recording.pdf_url || recording.pdfUrl || recording.pdf)}
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
                        <Dropdown.Item 
                          onClick={() => handlePlayVideo(recording.video_url || recording.videoUrl || recording.video)}
                        >
                          <FaPlayCircle className="me-2" />
                          Play Video
                        </Dropdown.Item>
                        {(recording.Pdf_url || recording.pdf_url || recording.pdfUrl || recording.pdf) && (
                          <>
                            <Dropdown.Item 
                              onClick={() => handleDirectPdfView(recording.Pdf_url || recording.pdf_url || recording.pdfUrl || recording.pdf)}
                            >
                              <FaFilePdf className="me-2" />
                              View PDF
                            </Dropdown.Item>
                           
                          </>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Video Modal - Accepts any video URL */}
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
              src={currentVideo}
              title="Meeting Recording"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ border: 'none' }}
            ></iframe>
          </div>
          <div className="mt-3 text-center">
            <small className="text-muted">
              If the video doesn't load, you can{" "}
              <a href={currentVideo} target="_blank" rel="noopener noreferrer">
                open it in a new tab
              </a>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={() => window.open(currentVideo, '_blank', 'noopener,noreferrer')}
          >
            Open in New Tab
          </Button>
          <Button variant="secondary" onClick={() => setShowVideoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Modal (Optional - kept for reference but not used in main flow) */}
      <Modal
        show={showPdfModal}
        onHide={() => setShowPdfModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Meeting Document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <FaFilePdf size={64} className="text-danger mb-3" />
          <h5>PDF Document</h5>
          <p className="text-muted">Choose how you want to handle this document:</p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="primary" onClick={handleViewPdf}>
            <FaFilePdf className="me-2" />
            View in Browser
          </Button>
         
          <Button variant="secondary" onClick={() => setShowPdfModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MeetingRecordings;