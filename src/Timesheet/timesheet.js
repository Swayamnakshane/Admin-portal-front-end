import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import {
  Badge,
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
  Table,
  Pagination,
  Navbar,
  Nav,
  Dropdown
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  FaSearch, 
  FaEdit, 
  FaChevronLeft, 
  FaChevronRight, 
  FaFilter, 
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaUserCog,
  FaEye,
  FaSync,
  FaCalendarAlt,
  FaCog
} from 'react-icons/fa';
import api from '../api/api';

// Status badge component
const StatusBadge = ({ status }) => {
  let variant, icon;
  
  switch (status) {
    case 'Approved':
      variant = 'success';
      icon = <FaCheckCircle className="me-1" />;
      break;
    case 'Rejected':
      variant = 'danger';
      icon = <FaTimesCircle className="me-1" />;
      break;
    case 'Pending':
    default:
      variant = 'warning';
      icon = <FaExclamationCircle className="me-1" />;
      break;
  }
  
  return (
    <Badge bg={variant} className="d-flex align-items-center">
      {icon}
      {status}
    </Badge>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [timesheetSearchTerm, setTimesheetSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Fetch all employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees when search term changes
  useEffect(() => {
    filterEmployees();
  }, [employeeSearchTerm, employees]);

  // Filter timesheets when search term, status filter, or timesheets change
  useEffect(() => {
    filterTimesheets();
  }, [timesheetSearchTerm, statusFilter, timesheets, currentPage]);

  // Fetch all employees
  const fetchEmployees = async () => {
    setEmployeeLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/get-all-employees');
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (error) {
      setError('Failed to fetch employees. Please try again.');
      toast.error('Failed to fetch employees.');
      console.error('Error fetching employees:', error);
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Filter employees based on search term
  const filterEmployees = () => {
    if (!employeeSearchTerm) {
      setFilteredEmployees(employees);
      return;
    }
    
    const term = employeeSearchTerm.toLowerCase();
    const filtered = employees.filter(employee => 
      employee.name.toLowerCase().includes(term) ||
      employee.employee_id.toLowerCase().includes(term) ||
      employee.email.toLowerCase().includes(term)
    );
    
    setFilteredEmployees(filtered);
  };

  // Fetch timesheets for selected employee and month
  const fetchEmployeeTimesheets = async (employeeId, month) => {
    if (!employeeId) return;
    
    setLoading(true);
    setError('');
    try {
      // Extract year and month from the selectedMonth value (YYYY-MM format)
      const [year, monthValue] = month.split('-');
      
      const response = await api.get(
        `/admin/employee/${employeeId}/timesheets?year=${year}&month=${monthValue}`
      );
      
      setTimesheets(response.data);
      setFilteredTimesheets(response.data);
    } catch (error) {
      setError('Failed to fetch timesheets. Please try again.');
      toast.error('Failed to fetch timesheets.');
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setTimesheetSearchTerm('');
    setStatusFilter('All');
    setCurrentPage(1);
    fetchEmployeeTimesheets(employee._id, selectedMonth);
  };

  // Handle month change
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (selectedEmployee) {
      fetchEmployeeTimesheets(selectedEmployee._id, month);
    }
  };

  // Generate month options for the dropdown
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = moment();
    
    // Generate options for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = moment(currentDate).subtract(i, 'months');
      months.push({
        value: date.format('YYYY-MM'),
        label: date.format('MMMM YYYY')
      });
    }
    
    return months;
  };

  // Filter timesheets based on search term and status filter
  const filterTimesheets = () => {
    let filtered = timesheets;

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(ts => ts.status === statusFilter);
    }

    // Apply search term
    if (timesheetSearchTerm) {
      const term = timesheetSearchTerm.toLowerCase();
      filtered = filtered.filter(ts => 
        moment(ts.date).format('MMM DD, YYYY').toLowerCase().includes(term) ||
        ts.total_hours.toString().includes(term) ||
        (ts.remarks && ts.remarks.toLowerCase().includes(term))
      );
    }

    setFilteredTimesheets(filtered);
  };

  // View timesheet details
  const viewTimesheetDetails = async (timesheet) => {
    setLoading(true);
    try {
      const date = moment(timesheet.date);
      const response = await api.get(
        `/admin/employee/${selectedEmployee._id}/timesheet/${date.year()}/${date.month() + 1}/${date.date()}`
      );
      
      setSelectedTimesheet(response.data);
      setShowDetailModal(true);
    } catch (error) {
      setError('Failed to fetch timesheet details.');
      toast.error('Failed to fetch timesheet details.');
      console.error('Error fetching timesheet details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setUpdateStatus(timesheet.status);
    setUpdateRemarks(timesheet.remarks || '');
    setShowUpdateModal(true);
  };

  // Submit status update
  const submitStatusUpdate = async () => {
    if (!updateStatus) {
      toast.error('Please select a status.');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/admin/update-timesheet-status/${selectedTimesheet.id}`, {
        status: updateStatus,
        remarks: updateRemarks
      });
      
      // Update local state
      const updatedTimesheets = timesheets.map(ts => 
        ts.id === selectedTimesheet.id 
          ? { ...ts, status: updateStatus, remarks: updateRemarks }
          : ts
      );
      
      setTimesheets(updatedTimesheets);
      setShowUpdateModal(false);
      toast.success('Timesheet status updated successfully.');
    } catch (error) {
      setError('Failed to update timesheet status.');
      toast.error('Failed to update timesheet status.');
      console.error('Error updating timesheet status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTimesheets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Format date for display
  const formatDate = (dateString) => {
    return moment(dateString).format('MMM DD, YYYY');
  };

  // Get month name from YYYY-MM format
  const getMonthName = (monthValue) => {
    return moment(monthValue, 'YYYY-MM').format('MMMM YYYY');
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand href="#">
            <FaUserCog className="me-2" />
            Admin Timesheet Management
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Nav.Link href="#"><FaCog className="me-1" /> Settings</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Sidebar - Employee List */}
          <Col md={3} className="mb-4">
            <Card>
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Employees</h5>
                <Button variant="light" size="sm" onClick={fetchEmployees} disabled={employeeLoading}>
                  {employeeLoading ? <Spinner animation="border" size="sm" /> : <FaSync />}
                </Button>
              </Card.Header>
              <Card.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Employee Search */}
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <FormControl
                    placeholder="Search employees..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  />
                </InputGroup>

                {employeeLoading && employees.length === 0 ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : filteredEmployees.length > 0 ? (
                  <div className="list-group">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee._id}
                        type="button"
                        className={`list-group-item list-group-item-action ${selectedEmployee && selectedEmployee._id === employee._id ? 'active' : ''}`}
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{employee.name}</h6>
                          <small>{employee.employee_id}</small>
                        </div>
                        <small className="text-muted">{employee.email}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    {employeeSearchTerm ? 'No employees match your search.' : 'No employees found.'}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content - Timesheets */}
          <Col md={9}>
            {selectedEmployee ? (
              <>
                <Card className="mb-4">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center flex-wrap">
                    <h5 className="mb-0">
                      Timesheets for {selectedEmployee.name} ({selectedEmployee.employee_id})
                    </h5>
                    <div className="d-flex align-items-center mt-2 mt-md-0">
                      <Badge bg="info" className="me-2">
                        {timesheets.length} timesheets in {getMonthName(selectedMonth)}
                      </Badge>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm" id="month-dropdown">
                          <FaCalendarAlt className="me-1" />
                          {getMonthName(selectedMonth)}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {generateMonthOptions().map(month => (
                            <Dropdown.Item 
                              key={month.value}
                              active={month.value === selectedMonth}
                              onClick={() => handleMonthChange(month.value)}
                            >
                              {month.label}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {/* Filters and Search */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <FormControl
                            placeholder="Search by date, hours, or remarks..."
                            value={timesheetSearchTerm}
                            onChange={(e) => setTimesheetSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => fetchEmployeeTimesheets(selectedEmployee._id, selectedMonth)}
                          disabled={loading}
                        >
                          {loading ? <Spinner animation="border" size="sm" /> : <><FaSync className="me-1" /> Refresh</>}
                        </Button>
                      </Col>
                    </Row>

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                      </Alert>
                    )}

                    {/* Timesheets Table */}
                    {loading && timesheets.length === 0 ? (
                      <div className="text-center my-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading timesheets...</p>
                      </div>
                    ) : filteredTimesheets.length > 0 ? (
                      <>
                        <Table responsive striped hover>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Total Hours</th>
                              <th>Status</th>
                              <th>Remarks</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map(timesheet => (
                              <tr key={timesheet.id}>
                                <td>
                                  <FaCalendarAlt className="me-2 text-muted" />
                                  {formatDate(timesheet.date)}
                                </td>
                                <td>
                                  <FaClock className="me-2 text-muted" />
                                  {timesheet.total_hours} hrs
                                </td>
                                <td>
                                  <StatusBadge status={timesheet.status} />
                                </td>
                                <td>
                                  {timesheet.remarks || (
                                    <span className="text-muted">No remarks</span>
                                  )}
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => viewTimesheetDetails(timesheet)}
                                    title="View Details"
                                    disabled={loading}
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(timesheet)}
                                    title="Update Status"
                                    disabled={loading}
                                  >
                                    <FaEdit />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-center">
                            <Pagination>
                              <Pagination.Prev 
                                disabled={currentPage === 1}
                                onClick={() => paginate(currentPage - 1)}
                              >
                                <FaChevronLeft />
                              </Pagination.Prev>
                              
                              {[...Array(totalPages)].map((_, index) => (
                                <Pagination.Item
                                  key={index + 1}
                                  active={index + 1 === currentPage}
                                  onClick={() => paginate(index + 1)}
                                >
                                  {index + 1}
                                </Pagination.Item>
                              ))}
                              
                              <Pagination.Next
                                disabled={currentPage === totalPages}
                                onClick={() => paginate(currentPage + 1)}
                              >
                                <FaChevronRight />
                              </Pagination.Next>
                            </Pagination>
                          </div>
                        )}
                      </>
                    ) : (
                      <Alert variant="info" className="text-center">
                        {timesheets.length === 0 
                          ? `No timesheets found for ${selectedEmployee.name} in ${getMonthName(selectedMonth)}.`
                          : 'No timesheets match your filters.'}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </>
            ) : (
              <Card>
                <Card.Body className="text-center py-5">
                  <FaUser className="display-1 text-muted mb-3" />
                  <h4>Select an employee to view timesheets</h4>
                  <p className="text-muted">
                    Choose an employee from the list to view and manage their timesheets.
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Timesheet Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Timesheet Details - {selectedTimesheet && formatDate(selectedTimesheet.date)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTimesheet ? (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Employee:</strong> {selectedEmployee.name}
                </Col>
                <Col md={6}>
                  <strong>Total Hours:</strong> {selectedTimesheet.total_hours}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status:</strong> <StatusBadge status={selectedTimesheet.status} />
                </Col>
                <Col md={6}>
                  <strong>Date:</strong> {formatDate(selectedTimesheet.date)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Remarks:</strong>{' '}
                  {selectedTimesheet.remarks || 'No remarks provided.'}
                </Col>
              </Row>
              <h6 className="mb-3">Time Slots:</h6>
              {selectedTimesheet.time_slots && selectedTimesheet.time_slots.length > 0 ? (
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTimesheet.time_slots.map((slot, index) => (
                      <tr key={index}>
                        <td>{slot.start_time}</td>
                        <td>{slot.end_time}</td>
                        <td>{slot.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">No time slots recorded for this day.</Alert>
              )}
            </>
          ) : (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Timesheet Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="text"
                value={selectedTimesheet ? formatDate(selectedTimesheet.date) : ''}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={updateRemarks}
                onChange={(e) => setUpdateRemarks(e.target.value)}
                placeholder="Add remarks about this timesheet..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitStatusUpdate} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;