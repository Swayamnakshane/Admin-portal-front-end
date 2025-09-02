import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/api';
import {
  FaUsers,
  FaUserClock,
  FaCalendarPlus,
  FaFileExcel,
  FaLink,
  FaUpload,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaExclamationTriangle
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
  Table,
  Pagination
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const EmployeeManagement = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_active: true
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // API call to fetch all employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/get-all-employe');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Please try again.');
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => 
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    let sortableItems = [...filteredEmployees];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEmployees, sortConfig]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle sort request
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please select a valid Excel file');
        return;
      }
      
      setUploadFile(file);
    }
  };

  // Submit uploaded file
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', uploadFile);

    try {
      setUploading(true);
      const response = await api.post('/admin/upload-employe', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchEmployees(); // Refresh the employee list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload employees');
    } finally {
      setUploading(false);
    }
  };

  // Handle edit employee
  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      is_active: employee.is_active
    });
    setValidationErrors({});
    setShowDeactivateWarning(false);
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Show warning when deactivating an employee
    if (name === 'is_active' && !fieldValue && selectedEmployee?.is_active) {
      setShowDeactivateWarning(true);
    } else if (name === 'is_active' && fieldValue) {
      setShowDeactivateWarning(false);
    }
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit employee update
  const handleUpdateSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Prepare data for API call
      const updateData = {
        name: formData.name,
        email: formData.email,
        is_active: formData.is_active
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.put(
        `/admin/update-employe/${selectedEmployee.employee_id}`,
        updateData
      );
      
      toast.success(response.data.message || 'Employee updated successfully');
      setShowEditModal(false);
      fetchEmployees(); // Refresh the employee list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employee');
    }
  };

  // Handle delete employee
  const handleDelete = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/delete-employe/${selectedEmployee.employee_id}`);
      toast.success(response.data.message);
      setShowDeleteModal(false);
      fetchEmployees(); // Refresh the employee list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    items.push(
      <Pagination.First 
        key="first" 
        onClick={() => paginate(1)} 
        disabled={currentPage === 1} 
      />
    );

    // Previous page
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => paginate(currentPage - 1)} 
        disabled={currentPage === 1} 
      />
    );

    // Page numbers
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => paginate(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // Next page
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => paginate(currentPage + 1)} 
        disabled={currentPage === totalPages} 
      />
    );

    // Last page
    items.push(
      <Pagination.Last 
        key="last" 
        onClick={() => paginate(totalPages)} 
        disabled={currentPage === totalPages} 
      />
    );

    return items;
  };

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">Employee Management</h2>
          <p className="text-muted">Manage your organization's employees</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center"
          >
            <FaUpload className="me-2" /> Upload Employees
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                <FaUsers size={24} className="text-primary" />
              </div>
              <div>
                <h6 className="card-subtitle mb-1 text-muted">Total Employees</h6>
                <h4 className="mb-0">{employees.length}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                <FaUserClock size={24} className="text-success" />
              </div>
              <div>
                <h6 className="card-subtitle mb-1 text-muted">Active Employees</h6>
                <h4 className="mb-0">
                  {employees.filter(emp => emp.is_active).length}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                <FaCalendarPlus size={24} className="text-info" />
              </div>
              <div>
                <h6 className="card-subtitle mb-1 text-muted">Inactive Employees</h6>
                <h4 className="mb-0">
                  {employees.filter(emp => !emp.is_active).length}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                <FaFileExcel size={24} className="text-warning" />
              </div>
              <div>
                <h6 className="card-subtitle mb-1 text-muted">Excel Templates</h6>
                <Button variant="link" className="p-0 text-decoration-none">
                  Download <FaLink size={12} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  placeholder="Search by ID, name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="filter-dropdown">
                  <FaFilter className="me-2" /> Filters
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleSort('name')}>
                    Sort by Name {renderSortIndicator('name')}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSort('employee_id')}>
                    Sort by ID {renderSortIndicator('employee_id')}
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => {
                    setSearchTerm('');
                    setSortConfig({ key: 'is_active', direction: 'ascending' });
                  }}>
                    Show Active First
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => {
                    setSearchTerm('');
                    setSortConfig({ key: 'is_active', direction: 'descending' });
                  }}>
                    Show Inactive First
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Employees Table */}
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading employees...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchEmployees}>
                Retry
              </Button>
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map(employee => (
                        <tr key={employee.employee_id}>
                          <td>
                            <Badge bg="light" text="dark">
                              {employee.employee_id}
                            </Badge>
                          </td>
                          <td>{employee.name}</td>
                          <td>{employee.email}</td>
                          <td>
                            <Badge bg={employee.is_active ? "success" : "danger"}>
                              {employee.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(employee)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(employee)}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          {searchTerm ? (
                            <>No employees found matching "<strong>{searchTerm}</strong>"</>
                          ) : (
                            'No employees found'
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3">
                  <div>
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedEmployees.length)} of{' '}
                    {sortedEmployees.length} entries
                  </div>
                  <Pagination className="mb-0">
                    {renderPaginationItems()}
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Employees</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Excel File Upload</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <Form.Text className="text-muted">
                Upload an Excel file with columns: employee_id, name, email, password
              </Form.Text>
            </Form.Group>
            
            {uploadFile && (
              <Alert variant="info" className="d-flex align-items-center">
                <FaFileExcel className="me-2" />
                <div>
                  <strong>Selected file:</strong> {uploadFile.name}
                </div>
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUploadSubmit}
            disabled={!uploadFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              'Upload Employees'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Employee ID</Form.Label>
              <Form.Control
                type="text"
                value={selectedEmployee?.employee_id || ''}
                disabled
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!validationErrors.name}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.name}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                isInvalid={!!validationErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.email}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_active"
                label="Active Employee"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            {showDeactivateWarning && (
              <Alert variant="warning" className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                <div>
                  <strong>Warning:</strong> Deactivating this employee will prevent them from accessing the system.
                  They will not be able to log in until their account is reactivated.
                </div>
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateSubmit}>
            Update Employee
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning: This action cannot be undone.</strong>
          </Alert>
          <p>
            Are you sure you want to delete employee <strong>{selectedEmployee?.name}</strong> ({selectedEmployee?.employee_id})?
          </p>
          <p className="text-muted">
            This action will permanently remove the employee record from the system.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Employee
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EmployeeManagement;