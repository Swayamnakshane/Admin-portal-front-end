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
  ListGroup,
  OverlayTrigger,
  Tooltip,
  ProgressBar
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const TaskManagementDashboard = () => {
  // State management
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [file, setFile] = useState(null);
  const [newTask, setNewTask] = useState({
    task_id: '',
    title: '',
    description: '',
    due_date: moment().add(7, 'days').format('DD-MM-YYYY'),
    assigned_to: [],
    status: 'Not Started'
  });
  const [approvalStatus, setApprovalStatus] = useState('Pending');
  const fileInputRef = useRef(null);

  // Employee map for quick lookup
  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(emp => map[emp.employee_id] = emp);
    return map;
  }, [employees]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const tasksResponse = await api.get('/admin/get-all-task');
        const employeesResponse = await api.get('/admin/get-all-employe');
        
        setTasks(tasksResponse.data);
        setEmployees(employeesResponse.data);
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks based on search and filters
  useEffect(() => {
    let result = tasks;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.task_id.toLowerCase().includes(term) ||
        (task.assigned_to && task.assigned_to.some(id => 
          employeeMap[id]?.name.toLowerCase().includes(term)
        )
      ));
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }
    
    // Apply approval filter
    if (approvalFilter !== 'all') {
      result = result.filter(task => task.approval_status === approvalFilter);
    }
    
    setFilteredTasks(result);
  }, [tasks, searchTerm, statusFilter, approvalFilter, employeeMap]);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      toast.warning('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      await api.post('/admin/upload-task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Tasks uploaded successfully');
      
      // Refresh tasks
      const tasksResponse = await api.get('/admin/get-all-task');
      setTasks(tasksResponse.data);
      setShowUploadModal(false);
      setFile(null);
    } catch (error) {
      toast.error('Failed to upload tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task update
  const handleTaskUpdate = async () => {
    try {
      setIsLoading(true);
      await api.put(`/admin/update-task/${selectedTask.task_id}`, {
        title: selectedTask.title,
        description: selectedTask.description,
        due_date: selectedTask.due_date,
        assigned_to: selectedTask.assigned_to,
        status: selectedTask.status
      });
      
      toast.success('Task updated successfully');
      
      // Refresh tasks
      const tasksResponse = await api.get('/admin/get-all-task');
      setTasks(tasksResponse.data);
      setShowTaskModal(false);
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      setIsLoading(true);
      await api.put(`/admin/update-task-status/${selectedTask.task_id}`, {
        approval_status: approvalStatus
      });
      
      toast.success('Status updated successfully');
      
      // Refresh tasks
      const tasksResponse = await api.get('/admin/get-all-task');
      setTasks(tasksResponse.data);
      setShowStatusModal(false);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create new task
  const handleCreateTask = async () => {
    // Generate Excel file in memory
    const taskForSheet = {
      ...newTask,
      assigned_to: newTask.assigned_to.join(',')
    };
    
    const formData = new FormData();
    const blob = new Blob([JSON.stringify([taskForSheet])], { type: 'application/json' });
    formData.append('file', blob, 'task.xlsx');
    
    try {
      setIsLoading(true);
      await api.post('/admin/upload-task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Task created successfully');
      
      // Refresh tasks
      const tasksResponse = await api.get('/admin/get-all-task');
      setTasks(tasksResponse.data);
      
      // Reset form
      setNewTask({
        task_id: '',
        title: '',
        description: '',
        due_date: moment().add(7, 'days').format('DD-MM-YYYY'),
        assigned_to: [],
        status: 'Not Started'
      });
      
      setShowTaskModal(false);
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  // Open task modal for editing
  const openTaskModal = (task) => {
    setSelectedTask({ ...task });
    setShowTaskModal(true);
  };

  // Open status modal
  const openStatusModal = (task) => {
    setSelectedTask(task);
    setApprovalStatus(task.approval_status);
    setShowStatusModal(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Not Started':
        return 'secondary';
      default:
        return 'light';
    }
  };

  // Get approval badge
  const getApprovalBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Pending':
        return 'warning';
      default:
        return 'light';
    }
  };

  // Render employee names
  const renderEmployeeNames = (employeeIds) => {
    if (!employeeIds || !Array.isArray(employeeIds)) return '-';
    
    return employeeIds.map(id => {
      const employee = employeeMap[id];
      return employee ? employee.name : id;
    }).join(', ');
  };

  // Render task cards
  const renderTaskCards = () => {
    if (filteredTasks.length === 0) {
      return (
        <Card className="mt-4">
          <Card.Body className="text-center py-5">
            <FaUserClock size={48} className="text-muted mb-3" />
            <h5>No tasks found</h5>
            <p className="text-muted">Try adjusting your search or filters</p>
          </Card.Body>
        </Card>
      );
    }

    return filteredTasks.map(task => (
      <Card key={task.task_id} className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center mb-2">
                <Badge bg={getApprovalBadge(task.approval_status)} className="me-2">
                  {task.approval_status}
                </Badge>
                <Badge bg={getStatusBadge(task.status)}>
                  {task.status}
                </Badge>
              </div>
              <Card.Title className="mb-1">{task.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">ID: {task.task_id}</Card.Subtitle>
            </div>
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm">
                <FaEllipsisV />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => openTaskModal(task)}>
                  <FaEdit className="me-2" /> Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={() => openStatusModal(task)}>
                  <FaCheck className="me-2" /> Update Status
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          
          <Card.Text className="mt-3">{task.description}</Card.Text>
          
          <div className="d-flex justify-content-between mt-3">
            <div>
              <small className="text-muted d-block">
                <FaCalendarAlt className="me-1" /> 
                Due: {task.due_date}
              </small>
              <small className="text-muted">
                <FaUserFriends className="me-1" /> 
                Assigned to: {renderEmployeeNames(task.assigned_to)}
              </small>
            </div>
            <div className="text-end">
              <small className="text-muted d-block">
                Created: {task.created_at}
              </small>
              <small className="text-muted">
                Last updated: {task.updated_at}
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>
    ));
  };

  // Render employee list
  const renderEmployeeList = () => (
    <ListGroup variant="flush">
      {employees.map(employee => (
        <ListGroup.Item key={employee.employee_id} className="d-flex justify-content-between align-items-center py-3">
          <div>
            <h6 className="mb-0">{employee.name}</h6>
            <small className="text-muted">{employee.employee_id}</small>
          </div>
          <div>
            <Badge bg="light" text="dark" className="me-2">
              {employee.email}
            </Badge>
            <Button size="sm" variant="outline-primary">
              Assign Task
            </Button>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <h1 className="mb-0">Task Management</h1>
          <p className="text-muted mb-0">Manage and track employee tasks</p>
        </Col>
        <Col md={6} className="d-flex justify-content-end">
          <Button variant="primary" className="me-2" onClick={() => setShowTaskModal(true)}>
            <FaPlus className="me-2" /> Create Task
          </Button>
          <Button variant="success" className="me-2" onClick={() => setShowUploadModal(true)}>
            <FaCalendarPlus className="me-2" /> Upload Tasks
          </Button>
          <Button variant="info" onClick={() => setShowEmployeesModal(true)}>
            <FaUsers className="me-2" /> View Employees
          </Button>
        </Col>
      </Row>
      
      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
              >
                <option value="all">All Approvals</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-start border-3 border-primary shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-0">Total Tasks</h6>
                  <h3 className="mb-0">{tasks.length}</h3>
                </div>
                <div className="icon-shape bg-primary text-white rounded-circle p-3">
                  <FaUserClock />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-3 border-success shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-0">Completed</h6>
                  <h3 className="mb-0">
                    {tasks.filter(t => t.status === 'Completed').length}
                  </h3>
                </div>
                <div className="icon-shape bg-success text-white rounded-circle p-3">
                  <FaCheck />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-3 border-warning shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-0">Pending Approval</h6>
                  <h3 className="mb-0">
                    {tasks.filter(t => t.approval_status === 'Pending').length}
                  </h3>
                </div>
                <div className="icon-shape bg-warning text-white rounded-circle p-3">
                  <FaClock />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-start border-3 border-info shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-0">Employees</h6>
                  <h3 className="mb-0">{employees.length}</h3>
                </div>
                <div className="icon-shape bg-info text-white rounded-circle p-3">
                  <FaUsers />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Task List */}
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        renderTaskCards()
      )}
      
      {/* Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedTask ? 'Edit Task' : 'Create New Task'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedTask ? selectedTask.task_id : newTask.task_id}
                    onChange={(e) => selectedTask 
                      ? setSelectedTask({...selectedTask, task_id: e.target.value}) 
                      : setNewTask({...newTask, task_id: e.target.value})
                    }
                    disabled={!!selectedTask}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={selectedTask ? selectedTask.status : newTask.status}
                    onChange={(e) => selectedTask 
                      ? setSelectedTask({...selectedTask, status: e.target.value}) 
                      : setNewTask({...newTask, status: e.target.value})
                    }
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={selectedTask ? selectedTask.title : newTask.title}
                onChange={(e) => selectedTask 
                  ? setSelectedTask({...selectedTask, title: e.target.value}) 
                  : setNewTask({...newTask, title: e.target.value})
                }
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={selectedTask ? selectedTask.description : newTask.description}
                onChange={(e) => selectedTask 
                  ? setSelectedTask({...selectedTask, description: e.target.value}) 
                  : setNewTask({...newTask, description: e.target.value})
                }
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={selectedTask ? selectedTask.due_date : newTask.due_date}
                    onChange={(e) => selectedTask 
                      ? setSelectedTask({...selectedTask, due_date: e.target.value}) 
                      : setNewTask({...newTask, due_date: e.target.value})
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign to Employees</Form.Label>
                  <Form.Select
                    multiple
                    value={selectedTask ? selectedTask.assigned_to : newTask.assigned_to}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      selectedTask 
                        ? setSelectedTask({...selectedTask, assigned_to: selected}) 
                        : setNewTask({...newTask, assigned_to: selected});
                    }}
                  >
                    {employees.map(employee => (
                      <option key={employee.employee_id} value={employee.employee_id}>
                        {employee.name} ({employee.employee_id})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={selectedTask ? handleTaskUpdate : handleCreateTask}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : selectedTask ? 'Update Task' : 'Create Task'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Approval Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Task</Form.Label>
              <Form.Control
                type="text"
                value={selectedTask ? `${selectedTask.task_id} - ${selectedTask.title}` : ''}
                disabled
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Approval Status</Form.Label>
              <Form.Select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusUpdate}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Tasks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label>Upload Excel File</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files[0])}
                ref={fileInputRef}
              />
              <Form.Text className="text-muted">
                Upload an Excel file containing task details
              </Form.Text>
            </Form.Group>
            
            <Alert variant="info">
              <FaLink className="me-2" />
              <strong>Excel Format:</strong> 
              <div className="mt-2">
                <div>task_id | title | description | due_date | assigned_to | status</div>
                <div className="text-muted small">assigned_to should be comma-separated employee IDs</div>
              </div>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleFileUpload}
            disabled={isLoading || !file}
          >
            {isLoading ? <Spinner size="sm" /> : 'Upload Tasks'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Employees Modal */}
      <Modal show={showEmployeesModal} onHide={() => setShowEmployeesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Employee Directory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoading ? (
            <div className="d-flex justify-content-center my-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>{employees.length} Employees</span>
                <Button size="sm" variant="outline-primary">
                  Export List
                </Button>
              </Card.Header>
              {renderEmployeeList()}
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmployeesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TaskManagementDashboard;