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
  FaUsers,
  FaTrash,
  FaCheck,
  FaCalendarPlus,
  FaUserClock,
  FaMapMarkerAlt,
  FaLink
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
  ProgressBar
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Modern color scheme
const COLORS = {
  primary: '#4361ee',
  secondary: '#4895ef',
  success: '#4cc9f0',
  warning: '#f72585',
  danger: '#e63946',
  light: '#f8f9fa',
  dark: '#212529',
  gradient: 'linear-gradient(135deg, #4361ee 0%, #4895ef 100%)',
  lightBg: '#f8fafc'
};

// Helper functions for date formatting
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return moment(dateString, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DDTHH:mm');
};

const formatDateForAPI = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).format('DD-MM-YYYY HH:mm');
};

// Meeting status badges
const StatusBadge = ({ status }) => {
  const variants = {
    Scheduled: 'primary',
    Completed: 'success',
    Cancelled: 'danger',
    InProgress: 'warning',
    Pending: 'info'
  };
  
  return <Badge pill bg={variants[status] || 'secondary'} className="py-2 px-3">{status}</Badge>;
};

// Custom form field component
const FormField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  error, 
  as, 
  icon,
  placeholder,
  required,
  ...props 
}) => (
  <Form.Group className="mb-4">
    <Form.Label className="fw-medium text-dark mb-2 d-flex align-items-center">
      {icon && React.cloneElement(icon, { className: "me-2" })}
      {label} 
      {required && <span className="text-danger ms-1">*</span>}
    </Form.Label>
    
    {as === 'select' ? (
      <div className="position-relative">
        <Form.Select
          name={name}
          value={value}
          onChange={onChange}
          isInvalid={!!error}
          className="py-3 border-0 rounded-3 shadow-sm"
          style={{ 
            backgroundColor: '#f8fafc',
            paddingLeft: icon ? '3rem' : '1.5rem',
            height: '56px'
          }}
          {...props}
        >
          {props.children}
        </Form.Select>
        {icon && (
          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
            {icon}
          </div>
        )}
      </div>
    ) : (
      <div className="position-relative">
        <Form.Control
          as={as}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          isInvalid={!!error}
          placeholder={placeholder}
          className={`py-3 border-0 rounded-3 shadow-sm ${as === 'textarea' ? 'resize-none' : ''}`}
          style={{ 
            backgroundColor: '#f8fafc',
            paddingLeft: icon ? '3rem' : '1.5rem',
            ...(as === 'textarea' ? { height: '120px' } : { height: '56px' })
          }}
          {...props}
        />
        {icon && (
          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
            {icon}
          </div>
        )}
      </div>
    )}
    
    {error && (
      <Form.Text className="text-danger d-block mt-2">
        {error}
      </Form.Text>
    )}
  </Form.Group>
);

// Meeting form component
const MeetingForm = ({ 
  show, 
  handleClose, 
  initialData, 
  refreshMeetings
}) => {
  const [formData, setFormData] = useState({
    meeting_type: '',
    title: '',
    description: '',
    location: '',
    date_time: moment().add(1, 'hours').format('YYYY-MM-DDTHH:mm'),
    duration_minutes: 60,
    link: '',
    agenda: '',
    notes: '',
    status: 'Scheduled',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        meeting_type: initialData.meeting_type || '',
        title: initialData.title || '',
        description: initialData.description || '',
        location: initialData.location || '',
        date_time: formatDateForInput(initialData.date_time),
        duration_minutes: initialData.duration_minutes || 60,
        link: initialData.link || '',
        agenda: initialData.agenda || '',
        notes: initialData.notes || '',
        status: initialData.status || 'Scheduled',
      });
    } else {
      // Reset form for new meeting
      setFormData({
        meeting_type: '',
        title: '',
        description: '',
        location: '',
        date_time: moment().add(1, 'hours').format('YYYY-MM-DDTHH:mm'),
        duration_minutes: 60,
        link: '',
        agenda: '',
        notes: '',
        status: 'Scheduled',
      });
    }
  }, [initialData, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.meeting_type) newErrors.meeting_type = 'Meeting type is required';
    if (!formData.date_time) newErrors.date_time = 'Date and time is required';
    if (formData.duration_minutes <= 0) newErrors.duration_minutes = 'Duration must be positive';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        date_time: formatDateForAPI(formData.date_time),
      };
      
      let response;
      
      if (initialData) {
        // Update existing meeting
        response = await api.put(
          `/admin/update-meeting/${initialData.meeting_id}`, 
          payload
        );
        toast.success('✅ Meeting updated successfully');
      } else {
        // Create meeting for all employees
        response = await api.post(
          '/admin/create-all-meeting', 
          payload
        );
        toast.success('✅ Meeting created for all employees');
      }
      
      console.log('API Response:', response.data);
      handleClose();
      refreshMeetings();
    } catch (error) {
      console.error('Meeting operation error:', error);
      let errorMsg = 'An error occurred while processing your request';
      
      if (error.response) {
        errorMsg = error.response.data?.message || error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered 
      backdrop="static"
      className="meeting-form-modal"
    >
      <Modal.Header 
        closeButton 
        className="py-4 border-0"
        style={{ 
          background: COLORS.gradient,
          color: 'white',
        }}
      >
        <Modal.Title className="fw-bold fs-3">
          {initialData ? 'Update Meeting' : 'Create Meeting for All Employees'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body 
        className="p-4 bg-light" 
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <Form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-4 shadow-sm"
          id="meeting-form"
        >
          <Row className="g-4">
            <Col md={6}>
              <FormField
                label="Meeting Type"
                name="meeting_type"
                as="select"
                value={formData.meeting_type}
                onChange={handleChange}
                error={errors.meeting_type}
                icon={<FaCalendarAlt />}
                required
              >
                <option value="">Select meeting type</option>
                <option>Team Meeting</option>
                <option>Project Review</option>
                <option>Client Meeting</option>
                <option>Training</option>
                <option>One-on-One</option>
                <option>Board Meeting</option>
                <option>Emergency Meeting</option>
              </FormField>
            </Col>
            
            <Col md={6}>
              <FormField
                label="Meeting Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter meeting title"
                required
              />
            </Col>
          </Row>
          
          <FormField
            label="Description"
            name="description"
            as="textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter meeting description"
          />
          
          <Row className="g-4">
            <Col md={6}>
              <FormField
                label="Date & Time"
                name="date_time"
                type="datetime-local"
                value={formData.date_time}
                onChange={handleChange}
                error={errors.date_time}
                icon={<FaClock />}
                required
              />
            </Col>
            
            <Col md={3}>
              <FormField
                label="Duration (minutes)"
                name="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={handleChange}
                min="1"
                error={errors.duration_minutes}
                required
              />
            </Col>
            
            {initialData && (
              <Col md={3}>
                <FormField
                  label="Status"
                  name="status"
                  as="select"
                  value={formData.status}
                  onChange={handleChange}
                  icon={<FaUserClock />}
                >
                  <option>Scheduled</option>
                  <option>InProgress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                  <option>Pending</option>
                </FormField>
              </Col>
            )}
          </Row>
          
          <Row className="g-4">
            <Col md={6}>
              <FormField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter meeting location"
                icon={<FaMapMarkerAlt />}
              />
            </Col>
            
            <Col md={6}>
              <FormField
                label="Meeting Link"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://meet.example.com"
                icon={<FaLink />}
              />
            </Col>
          </Row>
          
          <FormField
            label="Agenda"
            name="agenda"
            as="textarea"
            value={formData.agenda}
            onChange={handleChange}
            placeholder="Enter meeting agenda"
          />
          
          <FormField
            label="Notes"
            name="notes"
            as="textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter any additional notes"
          />
          
          <Alert variant="info" className="mt-4">
            <FaUsers className="me-2" />
            This meeting will be created for <strong>all employees</strong> in the system.
          </Alert>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0 bg-light">
        <Button 
          variant="outline-secondary" 
          onClick={handleClose} 
          disabled={loading}
          className="py-2 px-4 rounded-pill fw-medium shadow-sm"
          style={{ width: '120px' }}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          form="meeting-form"
          disabled={loading}
          className="py-2 px-4 rounded-pill fw-medium shadow-sm"
          style={{ 
            background: COLORS.gradient, 
            border: 'none',
            width: '180px'
          }}
        >
          {loading ? (
            <Spinner as="span" animation="border" size="sm" role="status" />
          ) : initialData ? (
            'Update Meeting'
          ) : (
            'Create Meeting'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Meeting card component
const MeetingCard = ({ meeting, onEdit, onDelete, deleting }) => {
  const formattedDate = moment(meeting.date_time, 'DD-MM-YYYY HH:mm').format('MMM D, YYYY h:mm A');
  const endTime = moment(meeting.date_time, 'DD-MM-YYYY HH:mm')
    .add(meeting.duration_minutes, 'minutes')
    .format('h:mm A');
  
  const isPastMeeting = moment(meeting.date_time, 'DD-MM-YYYY HH:mm').isBefore(moment());
  const isUpcoming = moment(meeting.date_time, 'DD-MM-YYYY HH:mm').isAfter(moment()) && meeting.status === 'Scheduled';
  
  // Calculate time until meeting
  const timeUntilMeeting = useMemo(() => {
    if (!isUpcoming) return null;
    const now = moment();
    const meetingTime = moment(meeting.date_time, 'DD-MM-YYYY HH:mm');
    const diffHours = meetingTime.diff(now, 'hours');
    const diffMinutes = meetingTime.diff(now, 'minutes') % 60;
    
    return `${diffHours}h ${diffMinutes}m`;
  }, [meeting, isUpcoming]);

  return (
    <Card className="mb-4 shadow-sm border-0 overflow-hidden" style={{ 
      borderRadius: '16px', 
      transition: 'transform 0.3s',
      borderLeft: `4px solid ${COLORS.primary}`,
      transform: deleting === meeting.meeting_id ? 'scale(0.98)' : 'scale(1)',
      opacity: deleting === meeting.meeting_id ? 0.8 : 1
    }}>
      <Card.Header 
        className="d-flex justify-content-between align-items-center py-3 px-4"
        style={{ 
          background: 'white',
          color: COLORS.dark,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div className="d-flex align-items-center">
          <StatusBadge status={meeting.status} className="me-2" />
          <span className="fw-medium text-dark">{meeting.meeting_type}</span>
        </div>
        <Dropdown>
          <Dropdown.Toggle variant="link" className="p-0 text-dark border-0 bg-transparent">
            <FaEllipsisV />
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-sm border-0 rounded-3" style={{ minWidth: '150px' }}>
            <Dropdown.Item onClick={() => onEdit(meeting)} className="py-2 d-flex align-items-center">
              <FaEdit className="me-2 text-primary" /> Edit
            </Dropdown.Item>
            <Dropdown.Item 
              onClick={() => onDelete(meeting.meeting_id)} 
              className="py-2 d-flex align-items-center"
            >
              <FaTrash className="me-2 text-danger" /> Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Header>
      <Card.Body className="p-4">
        <Card.Title className="mb-3 fw-bold text-dark fs-4">{meeting.title}</Card.Title>
        <Card.Text className="text-muted mb-4">{meeting.description}</Card.Text>
        
        <div className="d-flex flex-wrap gap-4 mb-4">
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 40, height: 40 }}>
              <FaCalendarAlt className="text-primary" />
            </div>
            <div>
              <div className="text-muted small">Date & Time</div>
              <strong className="text-dark d-block">{formattedDate}</strong>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 40, height: 40 }}>
              <FaClock className="text-primary" />
            </div>
            <div>
              <div className="text-muted small">Duration</div>
              <strong className="text-dark d-block">{meeting.duration_minutes} min</strong>
              <div className="text-muted small">Ends at {endTime}</div>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 40, height: 40 }}>
              <FaVideo className="text-primary" />
            </div>
            <div>
              <div className="text-muted small">Location</div>
              <strong className="text-dark d-block">{meeting.location || 'Virtual Meeting'}</strong>
            </div>
          </div>
        </div>
        
        {isUpcoming && (
          <div className="mb-4 bg-light p-3 rounded-3">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Meeting starts in:</span>
              <span className="fw-bold text-primary">{timeUntilMeeting}</span>
            </div>
            <ProgressBar 
              now={70} 
              variant="primary" 
              style={{ height: '8px', borderRadius: '4px' }}
            />
          </div>
        )}
        
        {meeting.link && !isPastMeeting && meeting.status === 'Scheduled' && (
          <Button 
            variant="success" 
            href={meeting.link} 
            target="_blank"
            className="mb-4 d-flex align-items-center py-2 px-4 rounded-pill fw-medium shadow-sm"
            style={{ background: COLORS.success, border: 'none' }}
          >
            <FaPlayCircle className="me-2" /> Join Meeting
          </Button>
        )}
        
        {meeting.agenda && (
          <div className="mb-4">
            <h6 className="text-dark mb-2 fw-medium d-flex align-items-center">
              <span className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2" 
                    style={{ width: 30, height: 30 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                  <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </span>
              Agenda
            </h6>
            <p className="text-muted">{meeting.agenda}</p>
          </div>
        )}
        
        {meeting.notes && (
          <div className="mb-4">
            <h6 className="text-dark mb-2 fw-medium d-flex align-items-center">
              <span className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2" 
                    style={{ width: 30, height: 30 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
                  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                </svg>
              </span>
              Notes
            </h6>
            <p className="text-muted">{meeting.notes}</p>
          </div>
        )}
        
        <div>
          <h6 className="text-dark fw-medium d-flex align-items-center mb-3">
            <FaUsers className="me-2" />
            Attendees: All Employees
          </h6>
          <Badge 
            bg="info" 
            className="p-2 px-3 d-inline-flex align-items-center shadow-sm"
            style={{ 
              borderRadius: '16px',
              fontWeight: '500'
            }}
          >
            <FaUsers className="me-1" /> All Employees
          </Badge>
        </div>
      </Card.Body>
      {deleting === meeting.meeting_id && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 rounded-3">
          <Spinner animation="border" variant="light" />
        </div>
      )}
    </Card>
  );
};

// Delete confirmation modal
const DeleteConfirmation = ({ show, onHide, onConfirm, meetingTitle }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="text-center mb-4">
          <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-3">
            <FaTrash className="text-danger" size={24} />
          </div>
        </div>
        <h5 className="text-center mb-3">Delete this meeting?</h5>
        <p className="text-muted text-center">
          Are you sure you want to delete the meeting <strong>"{meetingTitle}"</strong>?
          This action cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer className="border-top-0 justify-content-center">
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          className="px-4 rounded-pill shadow-sm"
        >
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={onConfirm}
          className="px-4 rounded-pill shadow-sm"
        >
          Delete Meeting
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Main meetings component
const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0
  });

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/get-meeting');
      setMeetings(response.data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      let errorMsg = 'Failed to load meetings data';
      if (err.response) {
        errorMsg = err.response.data?.message || err.response.statusText;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Calculate meeting statistics
  useEffect(() => {
    if (meetings.length > 0) {
      const now = moment();
      const upcoming = meetings.filter(m => 
        moment(m.date_time, 'DD-MM-YYYY HH:mm').isAfter(now) && m.status === 'Scheduled'
      ).length;
      
      const completed = meetings.filter(m => 
        m.status === 'Completed'
      ).length;
      
      setStats({
        total: meetings.length,
        upcoming,
        completed
      });
    }
  }, [meetings]);

  // Filter meetings based on search and filters
  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            meeting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            meeting.meeting_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'All' || meeting.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchTerm, filterStatus]);

  // Group meetings by date
  const groupedMeetings = useMemo(() => {
    return filteredMeetings.reduce((acc, meeting) => {
      const date = moment(meeting.date_time, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD');
      if (!acc[date]) acc[date] = [];
      acc[date].push(meeting);
      return acc;
    }, {});
  }, [filteredMeetings]);

  // Sort dates chronologically
  const sortedDates = useMemo(() => {
    return Object.keys(groupedMeetings).sort((a, b) => 
      moment(a).diff(moment(b))
    );
  }, [groupedMeetings]);

  // Refresh meetings list
  const refreshMeetings = async () => {
    await fetchMeetings();
  };

  // Handle meeting edit
  const handleEdit = (meeting) => {
    setCurrentMeeting(meeting);
    setShowForm(true);
  };

  // Handle meeting deletion confirmation
  const confirmDelete = (meetingId) => {
    const meeting = meetings.find(m => m.meeting_id === meetingId);
    if (meeting) {
      setMeetingToDelete(meeting);
      setShowDeleteModal(true);
    }
  };

  // Handle actual meeting deletion
  const handleDelete = async () => {
    if (!meetingToDelete) return;
    
    try {
      setDeletingId(meetingToDelete.meeting_id);
      await api.delete(`/admin/delete-meeting/${meetingToDelete.meeting_id}`);
      toast.success('✅ Meeting deleted successfully');
      refreshMeetings();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('❌ Failed to delete meeting');
    } finally {
      setDeletingId(null);
      setMeetingToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Handle new meeting creation
  const handleNewMeeting = () => {
    setCurrentMeeting(null);
    setShowForm(true);
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: COLORS.lightBg, minHeight: '100vh' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Delete confirmation modal */}
      <DeleteConfirmation 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        onConfirm={handleDelete}
        meetingTitle={meetingToDelete?.title || "this meeting"}
      />
      
      {/* Meeting form modal */}
      <MeetingForm
        show={showForm}
        handleClose={() => setShowForm(false)}
        initialData={currentMeeting}
        refreshMeetings={refreshMeetings}
      />
      
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="mb-1 fw-bold" style={{ 
            color: COLORS.primary,
            fontSize: '2.25rem'
          }}>
            Meeting Management
          </h1>
          <p className="text-muted">Create and manage meetings for all employees</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            className="d-flex align-items-center py-2 px-4 rounded-pill fw-medium shadow-sm"
            onClick={handleNewMeeting}
            style={{ 
              background: COLORS.gradient,
              border: 'none',
            }}
          >
            <FaPlus className="me-2" /> Create Meeting
          </Button>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        <Card className="border-0 shadow-sm flex-grow-1" style={{ minWidth: '250px', borderRadius: '16px' }}>
          <Card.Body className="d-flex align-items-center p-4">
            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 60, height: 60 }}>
              <FaCalendarPlus size={24} className="text-primary" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">{stats.total}</h5>
              <p className="text-muted mb-0">Total Meetings</p>
            </div>
          </Card.Body>
        </Card>
        
        <Card className="border-0 shadow-sm flex-grow-1" style={{ minWidth: '250px', borderRadius: '16px' }}>
          <Card.Body className="d-flex align-items-center p-4">
            <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 60, height: 60 }}>
              <FaUserClock size={24} className="text-success" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">{stats.upcoming}</h5>
              <p className="text-muted mb-0">Upcoming</p>
            </div>
          </Card.Body>
        </Card>
        
        <Card className="border-0 shadow-sm flex-grow-1" style={{ minWidth: '250px', borderRadius: '16px' }}>
          <Card.Body className="d-flex align-items-center p-4">
            <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: 60, height: 60 }}>
              <FaCheck size={24} className="text-warning" />
            </div>
            <div>
              <h5 className="mb-1 fw-bold">{stats.completed}</h5>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </Card.Body>
        </Card>
      </div>
      
      {/* Filters and search */}
      <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                <InputGroup.Text className="bg-white border-0 ps-4">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <FormControl
                  placeholder="Search meetings by title, description, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 py-3 bg-white"
                  style={{ paddingLeft: '0.5rem' }}
                />
              </InputGroup>
            </Col>
            
            <Col md={4}>
              <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                <InputGroup.Text className="bg-white border-0 ps-4">
                  <FaFilter className="text-muted" />
                </InputGroup.Text>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border-0 py-3 bg-white"
                  style={{ paddingLeft: '0.5rem' }}
                >
                  <option value="All">All Meetings</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Pending">Pending</option>
                </Form.Select>
              </InputGroup>
            </Col>
            
            <Col md={2} className="d-flex align-items-center">
              <Badge 
                bg="light" 
                className="p-2 px-3 w-100 text-center text-dark shadow-sm"
                style={{ 
                  borderRadius: '50px',
                  border: `1px solid ${COLORS.primary}20`,
                  fontWeight: '500'
                }}
              >
                {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading meetings...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <Card className="mb-4 border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}>
          <Card.Body className="py-5">
            <div className="mb-4">
              <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                </svg>
              </div>
            </div>
            <h4 className="mb-3">Failed to load meetings</h4>
            <p className="text-muted mb-4">{error}</p>
            <Button 
              variant="outline-primary"
              onClick={refreshMeetings}
              className="py-2 px-4 rounded-pill fw-medium shadow-sm"
            >
              Retry
            </Button>
          </Card.Body>
        </Card>
      )}
      
      {/* Meetings list */}
      {!loading && !error && (
        <div>
          {Object.keys(groupedMeetings).length === 0 ? (
            <Card className="text-center p-5 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="py-5">
                <div className="mb-4">
                  <div className="bg-light rounded-circle d-inline-flex p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                      <path d="M6 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                      <path d="M9 6a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                      <path d="M9 6h.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 7.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 16H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h7z"/>
                    </svg>
                  </div>
                </div>
                <h4 className="mb-3">No meetings found</h4>
                <p className="text-muted mb-4">
                  {searchTerm ? 'Try a different search term' : 'Create a new meeting to get started'}
                </p>
                <Button 
                  variant="primary"
                  onClick={handleNewMeeting}
                  className="d-flex align-items-center mx-auto py-2 px-4 rounded-pill fw-medium shadow-sm"
                  style={{ 
                    background: COLORS.gradient,
                    border: 'none'
                  }}
                >
                  <FaPlus className="me-2" /> Create Meeting
                </Button>
              </Card.Body>
        </Card>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="mb-5">
                <div className="d-flex align-items-center mb-4 p-3 bg-white rounded shadow-sm">
                  <h4 className="mb-0 fw-bold text-dark">{moment(date).format('MMMM D, YYYY')}</h4>
                  <Badge bg="light" className="ms-3 text-dark shadow-sm" style={{ fontWeight: '500' }}>
                    {groupedMeetings[date].length} meetings
                  </Badge>
                </div>
                
                <Row className="g-4">
                  {groupedMeetings[date].map(meeting => (
                    <Col key={meeting.meeting_id} lg={6}>
                      <MeetingCard 
                        meeting={meeting} 
                        onEdit={handleEdit} 
                        onDelete={confirmDelete}
                        deleting={deletingId === meeting.meeting_id}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </div>
      )}
    </Container>
  );
};

export default Meetings;