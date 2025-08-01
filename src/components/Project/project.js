import React, { useState, useEffect } from "react";
import {
  Container, Row, Col, Card, Badge, Button, Spinner,
   ProgressBar
} from "react-bootstrap";
import {
  FaBookOpen, FaUserGraduate, FaCheckCircle,
  FaSyncAlt, FaCalendarAlt, FaCertificate
} from "react-icons/fa";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

const ProjectDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  const fetchProject = async () => {
    try {
      const res = await api.get("/project/allotted");
      setProject(res.data.project);
    } catch (err) {
      toast.error("Failed to load project data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!project) {
    return (
      <Container className="mt-5">
        <Card className="p-4 text-center shadow-lg rounded-4 border-0">
          <h2 className="fw-bold text-danger mb-3">
            🚧 Project Not Allotted Yet
          </h2>
          <p className="fs-5 text-muted">
            <strong>This page will be open once allotted with project.</strong>
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <ToastContainer />

      {/* Banner/Header Section */}
      <Card className="mb-4 border-0 shadow-sm bg-light rounded-4 text-center p-4">
        <h4 className="text-uppercase text-dark fw-bold">
          🎓 This page will be open once allotted with project
        </h4>
      </Card>

      {/* Project Details */}
      <Card className="shadow-lg rounded-4 border-0 mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h3 className="mb-2 text-primary fw-bold">
                <FaBookOpen className="me-2" />
                {project.title}
              </h3>
              <p className="text-muted">{project.description}</p>
              <Badge bg="info" className="me-2">Domain: {project.domain}</Badge>
              <Badge bg="success">Status: {project.status}</Badge>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button variant="outline-primary" className="me-2">
                <FaCertificate className="me-1" /> View Docs
              </Button>
              <Button variant="outline-secondary">
                <FaSyncAlt className="me-1" /> Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Mentor and Timeline */}
      <Row className="g-4">
        <Col md={4}>
          <Card className="rounded-4 shadow-sm border-0 h-100">
            <Card.Body>
              <h5><FaUserGraduate className="me-2" />Mentor</h5>
              <p className="mb-1"><strong>{project.mentor.name}</strong></p>
              <p className="text-muted mb-0">{project.mentor.email}</p>
              <p className="text-muted">{project.mentor.contact}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="rounded-4 shadow-sm border-0 h-100">
            <Card.Body>
              <h5><FaCalendarAlt className="me-2" />Timeline</h5>
              <p>Start: {moment(project.start_date).format("LL")}</p>
              <p>End: {moment(project.end_date).format("LL")}</p>
              <ProgressBar now={project.progress} label={`${project.progress}%`} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Milestones */}
      <Card className="shadow-sm rounded-4 border-0 mt-4">
        <Card.Body>
          <h5 className="mb-3"><FaCheckCircle className="me-2" />Milestones</h5>
          {project.milestones.length === 0 ? (
            <p className="text-muted">No milestones added yet.</p>
          ) : (
            <ul className="list-group">
              {project.milestones.map((ms, idx) => (
                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                  {ms.title}
                  <Badge bg={ms.completed ? "success" : "secondary"}>
                    {ms.completed ? "Completed" : "Pending"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectDashboard;
