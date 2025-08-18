import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Row, Col, Card, Tab, Nav, 
  Badge, Button, Spinner, Alert, ProgressBar
} from "react-bootstrap";
import { 
  FaBookOpen, FaUserGraduate, FaCheckCircle, 
  FaRegClock, FaSyncAlt, FaCertificate
} from "react-icons/fa";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

// Skeleton Loader Component
const TrainingSkeleton = ({ count = 3 }) => (
  <Row xs={1} md={2} lg={3} className="g-4">
    {[...Array(count)].map((_, idx) => (
      <Col key={idx}>
        <Card className="h-100 border-0 shadow-sm">
          <div className="placeholder-glow">
            <div className="placeholder rounded-top" style={{ height: "160px" }} />
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <div className="placeholder placeholder-xs w-75 mb-2"></div>
                  <div className="placeholder placeholder-xs w-50"></div>
                </div>
                <div className="placeholder placeholder-xs w-25"></div>
              </div>
              <div className="placeholder placeholder-xs w-100 mb-1"></div>
              <div className="placeholder placeholder-xs w-100 mb-1"></div>
              <div className="placeholder placeholder-xs w-50 mb-4"></div>
              <div className="placeholder placeholder-lg w-100" style={{ height: "38px" }}></div>
            </Card.Body>
          </div>
        </Card>
      </Col>
    ))}
  </Row>
);

// Training Card Component
const TrainingCard = React.memo(({ 
  training, 
  onEnroll, 
  isLoading 
}) => (
  <Card className="h-100 border-0 shadow-sm hover-shadow transition-all">
    <div 
      className="card-img-top rounded-top bg-light" 
      style={{
        height: "160px",
        backgroundImage: training.image 
          ? `url(${training.image})` 
          : "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {!training.image && (
        <div className="d-flex h-100 align-items-center justify-content-center">
          <FaCertificate className="text-white" size={48} />
        </div>
      )}
      <Badge 
        bg="info" 
        className="position-absolute top-2 end-2 d-flex align-items-center shadow-sm"
      >
        <FaRegClock className="me-1" size={12} />
        {training.no_of_days} day{training.no_of_days > 1 ? "s" : ""}
      </Badge>
    </div>
    
    <Card.Body className="d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <Card.Title className="mb-0 text-primary fw-semibold">{training.title}</Card.Title>
          <small className="text-muted d-block mt-1">
            {training.provider}
          </small>
        </div>
      </div>
      
      <Card.Text className="text-muted flex-grow-1 mb-4">
        {training.description || "Professional development training program"}
      </Card.Text>
      
      <Button
        variant={isLoading ? "outline-primary" : "primary"}
        className="w-100 mt-auto"
        onClick={() => onEnroll(training.training_id)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner 
              as="span" 
              animation="border" 
              size="sm" 
              className="me-2" 
            />
            Enrolling...
          </>
        ) : (
          "Enroll Now"
        )}
      </Button>
    </Card.Body>
  </Card>
));

// Enrolled Training Card Component
const EnrolledTrainingCard = React.memo(({ training }) => {
  const isCompleted = training.status === "Completed";
  
  return (
    <Card className="shadow-sm border-0 rounded-3 overflow-hidden mb-4">
      <Card.Body className="p-0">
        <Row className="g-0">
          <Col md={4}>
            <div 
              className="h-100 bg-light"
              style={{
                height: "200px",
                backgroundImage: training.image 
                  ? `url(${training.image})` 
                  : "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {!training.image && (
                <FaCertificate className="text-white" size={48} />
              )}
            </div>
          </Col>
          <Col md={8}>
            <div className="p-4 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Card.Title className="mb-1 fs-5 fw-bold">{training.title}</Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    {training.provider}
                  </Card.Subtitle>
                </div>
                <Badge 
                  bg={isCompleted ? "success" : "primary"} 
                  className="d-inline-flex align-items-center px-3 py-2 fw-normal"
                >
                  {isCompleted ? (
                    <FaCheckCircle className="me-1" />
                  ) : (
                    <FaRegClock className="me-1" />
                  )}
                  {training.status}
                </Badge>
              </div>
              
              <Card.Text className="text-muted mb-4">
                {training.description || "Professional development training program"}
              </Card.Text>
              
              <div className="mt-auto">
                <div className="d-flex flex-wrap justify-content-between">
                  <div className="d-flex flex-wrap gap-3">
                    <div className="bg-light p-3 rounded-3 text-center flex-grow-1">
                      <div className="text-muted small mb-1">Duration</div>
                      <div className="fw-bold">
                        {training.no_of_days} day{training.no_of_days > 1 ? "s" : ""}
                      </div>
                    </div>
                    
                    <div className="bg-light p-3 rounded-3 text-center flex-grow-1">
                      <div className="text-muted small mb-1">Start Date</div>
                      <div className="fw-bold">
                        {moment(training.start_date).format("MMM D, YYYY")}
                      </div>
                    </div>
                    
                    <div className="bg-light p-3 rounded-3 text-center flex-grow-1">
                      <div className="text-muted small mb-1">End Date</div>
                      <div className="fw-bold">
                        {moment(training.end_date).format("MMM D, YYYY")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 w-100">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Progress</small>
                      <small className="fw-bold">{isCompleted ? 100 : Math.round(training.progress)}%</small>
                    </div>
                    <ProgressBar 
                      now={isCompleted ? 100 : training.progress} 
                      variant={isCompleted ? "success" : "primary"}
                      className="rounded-pill"
                      style={{ height: "8px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
});

const TrainingLearning = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [availableTrainings, setAvailableTrainings] = useState([]);
  const [myTrainings, setMyTrainings] = useState([]);
  const [loading, setLoading] = useState({ 
    available: false, 
    myTrainings: false,
    enrolling: null 
  });
  const [error, setError] = useState(null);

  // Fetch available trainings
  const fetchAvailableTrainings = useCallback(async () => {
    setLoading(prev => ({ ...prev, available: true }));
    try {
      const response = await api.get("employee/training/available");
      setAvailableTrainings(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load available trainings. Please try again later.");
      console.error("Fetch available trainings error:", err);
    } finally {
      setLoading(prev => ({ ...prev, available: false }));
    }
  }, []);

  // Fetch user's enrolled trainings
  const fetchMyTrainings = useCallback(async () => {
    setLoading(prev => ({ ...prev, myTrainings: true }));
    try {
      const response = await api.get("/employee/training/my-trainings");
      // Add progress calculation to each training
      const trainingsWithProgress = response.data.map(training => {
        const progress = calculateProgress(training);
        return { ...training, progress };
      });
      setMyTrainings(trainingsWithProgress);
      setError(null);
    } catch (err) {
      setError("Failed to load your trainings. Please try again later.");
      console.error("Fetch my trainings error:", err);
    } finally {
      setLoading(prev => ({ ...prev, myTrainings: false }));
    }
  }, []);

  // Calculate training progress
  const calculateProgress = (training) => {
    if (training.status === "Completed") return 100;
    
    const start = moment(training.start_date);
    const end = moment(training.end_date);
    const today = moment();
    
    if (today.isAfter(end)) return 100;
    
    const totalDays = end.diff(start, "days");
    const daysPassed = today.diff(start, "days");
    
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  };

  // Enroll in a training
  const handleEnroll = useCallback(async (trainingId) => {
    setLoading(prev => ({ ...prev, enrolling: trainingId }));
    try {
      await api.post(`/employee/training/enroll/${trainingId}`);
      
      toast.success("🎉 Training enrolled successfully!");
      
      // Optimistic updates
      const enrolledTraining = availableTrainings.find(t => t.training_id === trainingId);
      if (enrolledTraining) {
        const progress = calculateProgress({
          ...enrolledTraining,
          start_date: moment().format("YYYY-MM-DD"),
          end_date: moment().add(enrolledTraining.no_of_days, 'days').format("YYYY-MM-DD"),
          status: "In Progress"
        });
        
        setMyTrainings(prev => [
          ...prev, 
          {
            ...enrolledTraining,
            start_date: moment().format("YYYY-MM-DD"),
            end_date: moment().add(enrolledTraining.no_of_days, 'days').format("YYYY-MM-DD"),
            status: "In Progress",
            progress
          }
        ]);
        
        setAvailableTrainings(prev => 
          prev.filter(training => training.training_id !== trainingId)
        );
      }
      
      // Refresh data from server in background
      fetchAvailableTrainings();
      fetchMyTrainings();
    } catch (err) {
      toast.error("⚠️ Enrollment failed. Please try again.");
      console.error("Enrollment error:", err);
    } finally {
      setLoading(prev => ({ ...prev, enrolling: null }));
    }
  }, [availableTrainings, fetchAvailableTrainings, fetchMyTrainings]);

  // Refresh all data
  const refreshData = useCallback(() => {
    fetchAvailableTrainings();
    fetchMyTrainings();
    toast.info("Data refreshed successfully");
  }, [fetchAvailableTrainings, fetchMyTrainings]);

  useEffect(() => {
    fetchAvailableTrainings();
    fetchMyTrainings();
  }, [fetchAvailableTrainings, fetchMyTrainings]);

  return (
    <Container className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="d-flex align-items-center mb-1">
            <FaBookOpen className="me-2 text-primary" />
            Training & Development
          </h2>
          <p className="text-muted mb-0">
            Advance your career with our professional development programs
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center"
            onClick={refreshData}
            disabled={loading.available || loading.myTrainings}
          >
            <FaSyncAlt className={loading.available || loading.myTrainings ? "me-2 spin" : "me-2"} />
            Refresh
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Tab.Container activeKey={activeTab} onSelect={k => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4 nav-tabs-custom">
          <Nav.Item>
            <Nav.Link eventKey="available" className="d-flex align-items-center">
              <FaBookOpen className="me-2" />
              Available Trainings
              {availableTrainings.length > 0 && (
                <Badge bg="info" className="ms-2">
                  {availableTrainings.length}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="myTrainings" className="d-flex align-items-center">
              <FaUserGraduate className="me-2" />
              My Trainings
              {myTrainings.length > 0 && (
                <Badge bg="primary" className="ms-2">
                  {myTrainings.length}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Available Trainings Tab */}
          <Tab.Pane eventKey="available">
            {loading.available ? (
              <TrainingSkeleton count={3} />
            ) : availableTrainings.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <FaBookOpen size={48} className="text-muted mb-3 opacity-50" />
                <h4>No trainings available</h4>
                <p className="text-muted mb-4">
                  All current training programs have been enrolled or new ones are coming soon
                </p>
                <Button 
                  variant="outline-primary"
                  onClick={refreshData}
                >
                  Check for updates
                </Button>
              </div>
            ) : (
              <Row xs={1} md={2} lg={3} className="g-4">
                {availableTrainings.map((training) => (
                  <Col key={training.training_id}>
                    <TrainingCard 
                      training={training}
                      onEnroll={handleEnroll}
                      isLoading={loading.enrolling === training.training_id}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Tab.Pane>

          {/* My Trainings Tab */}
          <Tab.Pane eventKey="myTrainings">
            {loading.myTrainings ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading your trainings...</p>
              </div>
            ) : myTrainings.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3">
                <FaUserGraduate size={48} className="text-muted mb-3 opacity-50" />
                <h4>No active enrollments</h4>
                <p className="text-muted mb-4">
                  Enroll in training programs to start your professional development journey
                </p>
                <Button 
                  variant="primary" 
                  className="mt-2"
                  onClick={() => setActiveTab("available")}
                >
                  Browse Available Trainings
                </Button>
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-4 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center">
                    <FaUserGraduate className="text-primary me-2" size={24} />
                    <h5 className="mb-0">My Learning Path</h5>
                  </div>
                  <Badge bg="primary" className="fs-6 px-3 py-2">
                    {myTrainings.filter(t => t.status !== "Completed").length} Active
                  </Badge>
                </div>
                
                <div className="enrolled-trainings-container">
                  {myTrainings.map((training) => (
                    <EnrolledTrainingCard 
                      key={training.training_id} 
                      training={training} 
                    />
                  ))}
                </div>9
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default TrainingLearning;