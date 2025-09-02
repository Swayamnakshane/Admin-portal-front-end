import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import api from '../api/api';
import {
  FaVideo,
  FaClock,
  FaCalendarAlt,
  FaEllipsisV,
  FaPlayCircle,
  FaPlus,
  FaEdit,
  FaSearch,
  FaFilter,
  FaUserFriends,
  FaUsers,
  FaTrash,
  FaTimes,
  FaCheck,
  FaCalendarPlus,
  FaUserClock,
  FaMapMarkerAlt,
  FaLink,
  FaUpload,
  FaFileExcel
} from 'react-icons/fa';
import { 
  Badge, 
  Dropdown, 
  Button, 
  Card, 
  Spinner,
  Modal,
  Form,
  Row,
  Col,
  InputGroup,
  FormControl,
  Container,
  Alert,
  ListGroup,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
  Table,
  Pagination
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const RecordingManagement = () => {
  // State management
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const itemsPerPage = 8;

  // Form ref
  const formRef = useRef();

  // Initial form state
  const initialFormState = {
    meeting_record_id: '',
    title: '',
    day: '',
    date_time: '',
    description: '',
    pdf_name: '',
    Pdf_url: '',
    video_url: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch recordings on component mount
  useEffect(() => {
    fetchRecordings();
  }, []);

  // API call to fetch recordings
  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/get-recording');
      if (response.data) {
        setRecordings(response.data);
      }
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Failed to fetch recordings. Please try again.');
      toast.error('Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  // Filter recordings based on search term
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => 
      recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.meeting_record_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recordings, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);
  const paginatedRecordings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecordings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecordings, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle modal open for adding new recording
  const handleAddRecording = () => {
    setModalType('add');
    setFormData(initialFormState);
    setValidationErrors({});
    setShowModal(true);
  };

  // Handle modal open for editing recording
  const handleEditRecording = (recording) => {
    setModalType('edit');
    setSelectedRecording(recording);
    setFormData({
      meeting_record_id: recording.meeting_record_id || '',
      title: recording.title || '',
      day: recording.day || '',
      date_time: recording.date_time || '',
      description: recording.description || '',
      pdf_name: recording.pdf_name || '',
      Pdf_url: recording.Pdf_url || '',
      video_url: recording.video_url || ''
    });
    setValidationErrors({});
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.meeting_record_id.trim()) errors.meeting_record_id = 'Meeting ID is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.day.trim()) errors.day = 'Day is required';
    if (!formData.date_time.trim()) errors.date_time = 'Date is required';
    if (!formData.video_url.trim()) errors.video_url = 'Video URL is required';
    
    // Validate URLs if provided
    if (formData.Pdf_url && !isValidUrl(formData.Pdf_url)) errors.Pdf_url = 'Please enter a valid URL';
    if (formData.video_url && !isValidUrl(formData.video_url)) errors.video_url = 'Please enter a valid URL';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setUploading(true);
    
    try {
      if (modalType === 'add') {
        // Add new recording
        const response = await api.post('/admin/upload-recording', formData);
        toast.success(response.data.message || 'Recording uploaded successfully');
      } else {
        // Update existing recording
        const response = await api.put(`/admin/update-recording/${selectedRecording.recording_id}`, formData);
        toast.success('Recording updated successfully');
      }
      
      setShowModal(false);
      fetchRecordings(); // Refresh the list
    } catch (err) {
      console.error('Error saving recording:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save recording';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // // Handle delete recording
  // const handleDeleteRecording = async (recording) => {
  //   if (window.confirm(`Are you sure you want to delete "${recording.title}"?`)) {
  //     try {
  //       // Since there's no delete endpoint in the provided APIs, we'll just show a message
  //       toast.info('Delete functionality would be implemented here with the appropriate API');
  //       // In a real implementation, you would call:
  //       // await api.delete(`/admin/delete-recording/${recording.recording_id}`);
  //       // fetchRecordings(); // Refresh the list
  //     } catch (err) {
  //       console.error('Error deleting recording:', err);
  //       toast.error('Failed to delete recording');
  //     }
  //   }
  // };

  // Format date for display
  const formatDate = (dateString) => {
    return moment(dateString, 'DD/MM/YYYY').format('MMM DD, YYYY');
  };

  // Reset search
  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">Recording Management</h2>
          <p className="text-muted">Manage training sessions and recordings</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleAddRecording}
            className="d-flex align-items-center"
          >
            <FaPlus className="me-2" /> Add Recording
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FaVideo className="text-primary" size={24} />
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">{recordings.length}</h5>
                  <p className="text-muted mb-0">Total Recordings</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FaPlayCircle className="text-success" size={24} />
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">
                    {recordings.filter(r => r.video_url).length}
                  </h5>
                  <p className="text-muted mb-0">With Videos</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <FaFileExcel className="text-info" size={24} />
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">
                    {recordings.filter(r => r.Pdf_url).length}
                  </h5>
                  <p className="text-muted mb-0">With PDFs</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FaCalendarAlt className="text-warning" size={24} />
                </div>
                <div className="ms-3">
                  <h5 className="mb-0">
                    {new Set(recordings.map(r => r.day)).size}
                  </h5>
                  <p className="text-muted mb-0">Training Days</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Search by title, day, or meeting ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={clearSearch}>
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={4}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  <FaFilter className="me-2" /> Filter by Day
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={clearSearch}>All Days</Dropdown.Item>
                  {[...new Set(recordings.map(r => r.day))].map(day => (
                    <Dropdown.Item 
                      key={day} 
                      onClick={() => setSearchTerm(day)}
                    >
                      {day}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Recordings Table */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading recordings...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-4">
              {error}
            </Alert>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-5">
              <FaVideo size={48} className="text-muted mb-3" />
              <h5>No recordings found</h5>
              <p className="text-muted">
                {searchTerm ? 'Try adjusting your search query' : 'Get started by adding your first recording'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleAddRecording}>
                  Add Recording
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Day</th>
                      <th>Date</th>
                      <th>Meeting ID</th>
                      <th>Resources</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecordings.map(recording => (
                      <tr key={recording.recording_id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                              <FaVideo className="text-primary" />
                            </div>
                            <div>
                              <div className="fw-semibold">{recording.title}</div>
                              <div className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                                {recording.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark">
                            {recording.day}
                          </Badge>
                        </td>
                        <td>{formatDate(recording.date_time)}</td>
                        <td>
                          <code>{recording.meeting_record_id}</code>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {recording.video_url && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>View Video</Tooltip>}
                              >
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  as="a"
                                  href={recording.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FaPlayCircle />
                                </Button>
                              </OverlayTrigger>
                            )}
                            {recording.Pdf_url && (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>View PDF</Tooltip>}
                              >
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  as="a"
                                  href={recording.Pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FaFileExcel />
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>
                        </td>
                        <td className="text-end">
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="link" className="text-dark p-0">
                              <FaEllipsisV />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleEditRecording(recording)}>
                                <FaEdit className="me-2" /> Edit
                              </Dropdown.Item>
                              {/* <Dropdown.Item 
                                className="text-danger" 
                                onClick={() => handleDeleteRecording(recording)}
                              >
                                <FaTrash className="me-2" /> Delete
                              </Dropdown.Item> */}
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted">
                    Showing {paginatedRecordings.length} of {filteredRecordings.length} recordings
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.Prev 
                      disabled={currentPage === 1} 
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={currentPage === totalPages} 
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Recording Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleSubmit} ref={formRef}>
          <Modal.Header closeButton>
            <Modal.Title>
              {modalType === 'add' ? 'Add New Recording' : 'Edit Recording'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Meeting ID *</Form.Label>
                  <Form.Control
                    type="text"
                    name="meeting_record_id"
                    value={formData.meeting_record_id}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.meeting_record_id}
                    placeholder="e.g., MEET001"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.meeting_record_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Day *</Form.Label>
                  <Form.Control
                    type="text"
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.day}
                    placeholder="e.g., Day 1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                isInvalid={!!validationErrors.title}
                placeholder="Enter session title"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="text"
                    name="date_time"
                    value={formData.date_time}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.date_time}
                    placeholder="DD/MM/YYYY"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.date_time}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Format: DD/MM/YYYY (e.g., 18/08/2025)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter session description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Video URL (Google Drive) *</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLink />
                </InputGroup.Text>
                <Form.Control
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.video_url}
                  placeholder="https://drive.google.com/..."
                />
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                {validationErrors.video_url}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>PDF Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="pdf_name"
                value={formData.pdf_name}
                onChange={handleInputChange}
                placeholder="Enter PDF document name"
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label>PDF URL (Google Drive, Optional)</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLink />
                </InputGroup.Text>
                <Form.Control
                  type="url"
                  name="Pdf_url"
                  value={formData.Pdf_url}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.Pdf_url}
                  placeholder="https://drive.google.com/..."
                />
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                {validationErrors.Pdf_url}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowModal(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {modalType === 'add' ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  {modalType === 'add' ? 'Upload Recording' : 'Update Recording'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default RecordingManagement;