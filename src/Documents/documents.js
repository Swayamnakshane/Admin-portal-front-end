import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import api from '../api/api';
import { 
  Badge, Button, Card, Spinner, Modal, Form, Row, Col, 
  InputGroup, Table, Container, Alert, Tooltip, OverlayTrigger
} from 'react-bootstrap';
import { 
  FaSearch, FaFilter, FaLink, FaEdit, FaSync, FaUser, 
  FaInfoCircle, FaFileAlt, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';

const DocumentVerificationAdmin = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [formData, setFormData] = useState({
    verification_status: 'Approved',
    verification_notes: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Status badge configuration
  const statusBadges = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger'
  };

  // URL validation function
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Fetch all employees
  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await api.get('/admin/get-all-employe');
      setEmployees(response.data || []);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  // Fetch documents for employee with robust error handling
  const fetchDocuments = useCallback(async (empId) => {
    if (!empId) return;
    
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    
    try {
      const response = await api.get(`/admin/get-DocumentUpload/${empId}`);
      
      // Handle different response types
      if (Array.isArray(response.data)) {
        // Array of documents
        setDocuments(response.data);
      } else if (response.data && response.data.message) {
        // Message response (e.g., "No documents found")
        setDocuments([]);
        setInfoMessage(response.data.message);
      } else if (response.data && response.data.documents) {
        // Object with documents array
        setDocuments(response.data.documents || []);
      } else {
        // Unexpected response format
        setDocuments([]);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch documents';
      setError(errorMessage);
      setDocuments([]);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let result = documents;
    
    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(doc => doc.verification_status === statusFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc => 
        (doc.document_name?.toLowerCase().includes(query) || 
        (doc.document_type?.toLowerCase().includes(query))
      )
        );
    }
    
    setFilteredDocs(result);
  }, [documents, statusFilter, searchQuery]);

  // Handle update status with proper success/error messages
  const handleUpdateStatus = async () => {
    if (!currentDocument) return;
    
    setIsUpdating(true);
    
    try {
      const response = await api.put(
        `/admin/UpdateStatusDocumentUpload/${currentDocument.document_id}`,
        formData
      );
      
      // Show success message from server or generic
      const successMessage = response.data?.message || 'Document status updated successfully';
      toast.success(successMessage);
      
      // Refresh documents
      fetchDocuments(selectedEmployee?.employee_id);
      setShowUpdateModal(false);
    } catch (err) {
      // Show error message from server or generic
      const errorMessage = err.response?.data?.message || 'Failed to update document status';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open update modal
  const openUpdateModal = (doc) => {
    setCurrentDocument(doc);
    setFormData({
      verification_status: doc.verification_status === 'Pending' ? 'Approved' : doc.verification_status,
      verification_notes: doc.verification_notes || ''
    });
    setShowUpdateModal(true);
  };

  // Format date - HANDLES MULTIPLE FORMATS
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    
    // Handle different date formats from API
    if (dateStr.includes('-') && dateStr.charAt(4) === '-') {
      return moment(dateStr, 'YYYY-MM-DD HH:mm:ss').format('MMM D, YYYY h:mm A');
    }
    return moment(dateStr, 'DD-MM-YYYY HH:mm').format('MMM D, YYYY h:mm A');
  };

  // Handle form changes
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle employee selection
  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    if (!empId) {
      setSelectedEmployee(null);
      setDocuments([]);
      setError(null);
      setInfoMessage(null);
      return;
    }
    
    const employee = employees.find(emp => emp.employee_id === empId);
    if (employee) {
      setSelectedEmployee(employee);
      fetchDocuments(empId);
    }
  };

  // Initialize employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const documentStats = useMemo(() => {
    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    documents.forEach(doc => {
      if (doc.verification_status === 'Pending') stats.pending++;
      if (doc.verification_status === 'Approved') stats.approved++;
      if (doc.verification_status === 'Rejected') stats.rejected++;
    });
    
    return stats;
  }, [documents]);

  // Clear filters handler
  const handleClearFilters = () => {
    setStatusFilter('All');
    setSearchQuery('');
  };
   
  return (
    <Container className="py-4">
      <ToastContainer position="top-right" />
      
      {/* Header Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <h2 className="mb-0">Document Verification</h2>
              <p className="text-muted mb-0">Manage employee document verification</p>
            </Col>
            <Col md={6} className="text-md-end">
              <Button 
                variant="outline-primary" 
                onClick={() => selectedEmployee && fetchDocuments(selectedEmployee.employee_id)}
                disabled={!selectedEmployee}
              >
                <FaSync className="me-2" />
                Refresh Documents
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Employee Selection */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Select Employee</Form.Label>
                {isLoadingEmployees ? (
                  <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span>Loading employees...</span>
                  </div>
                ) : (
                  <Form.Select 
                    onChange={handleEmployeeSelect}
                    value={selectedEmployee?.employee_id || ''}
                    disabled={employees.length === 0}
                  >
                    <option value="">-- Select an employee --</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.name} ({emp.employee_id}) - {emp.email}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status Filter</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={!selectedEmployee}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search Documents</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!selectedEmployee}
                  />
                  {searchQuery && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchQuery('')}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Employee Info & Stats */}
      {selectedEmployee && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>
                  <FaUser className="me-2 text-primary" />
                  {selectedEmployee.name}
                </h5>
                <div className="text-muted">
                  <div>Employee ID: {selectedEmployee.employee_id}</div>
                  <div>Email: {selectedEmployee.email}</div>
                  <div>
                    Last Updated: {formatDate(selectedEmployee.updated_at)}
                  </div>
                </div>
              </Col>
              
              <Col md={6}>
                <div className="d-flex justify-content-around text-center">
                  <div>
                    <div className="fs-4 fw-bold">{documentStats.total}</div>
                    <div className="text-muted small">Total Docs</div>
                  </div>
                  <div>
                    <div className="fs-4 fw-bold text-warning">{documentStats.pending}</div>
                    <div className="text-muted small">Pending</div>
                  </div>
                  <div>
                    <div className="fs-4 fw-bold text-success">{documentStats.approved}</div>
                    <div className="text-muted small">Approved</div>
                  </div>
                  <div>
                    <div className="fs-4 fw-bold text-danger">{documentStats.rejected}</div>
                    <div className="text-muted small">Rejected</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Status Indicators */}
      <div className="d-flex mb-4">
        <div className="d-flex align-items-center me-4">
          <Badge bg="warning" className="me-2" pill> </Badge>
          <span>Pending Verification</span>
        </div>
        <div className="d-flex align-items-center me-4">
          <Badge bg="success" className="me-2" pill> </Badge>
          <span>Approved</span>
        </div>
        <div className="d-flex align-items-center">
          <Badge bg="danger" className="me-2" pill> </Badge>
          <span>Rejected</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading documents...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="my-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Info Message (e.g., no documents found) */}
      {infoMessage && !isLoading && (
        <Alert variant="info" className="my-4">
          <strong>Information:</strong> {infoMessage}
        </Alert>
      )}

      {/* Documents Table */}
      {!isLoading && selectedEmployee && filteredDocs.length > 0 && (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.document_id}>
                      <td>
                        <div className="fw-semibold">{doc.document_name}</div>
                        <small className="text-muted">ID: {doc.document_id}</small>
                      </td>
                      <td>{doc.document_type}</td>
                      <td>
                        <div>{formatDate(doc.uploaded_at)}</div>
                        <small className="text-muted">
                          {doc.uploaded_by === selectedEmployee.employee_id ? 'Self-uploaded' : 'Admin uploaded'}
                        </small>
                      </td>
                      <td>
                        <Badge bg={statusBadges[doc.verification_status]} pill>
                          {doc.verification_status}
                        </Badge>
                        {doc.verification_notes && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{doc.verification_notes}</Tooltip>}
                          >
                            <span className="ms-2"><FaInfoCircle /></span>
                          </OverlayTrigger>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          {doc.document_url && isValidUrl(doc.document_url) ? (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>View document</Tooltip>}
                            >
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => window.open(doc.document_url, '_blank')}
                              >
                                <FaLink />
                              </Button>
                            </OverlayTrigger>
                          ) : (
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Invalid URL</Tooltip>}
                            >
                              <Button variant="outline-secondary" size="sm" disabled>
                                <FaLink />
                              </Button>
                            </OverlayTrigger>
                          )}
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Update status</Tooltip>}
                          >
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => openUpdateModal(doc)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Empty States */}
      {!isLoading && !selectedEmployee && (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <div className="display-5 text-primary mb-3">
              <FaUser />
            </div>
            <h4>Select an Employee</h4>
            <p className="text-muted">
              Choose an employee from the dropdown to view their documents
            </p>
          </Card.Body>
        </Card>
      )}

      {!isLoading && selectedEmployee && documents.length === 0 && !error && !infoMessage && (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <div className="display-5 text-warning mb-3">
              <FaFileAlt />
            </div>
            <h4>No Documents Found</h4>
            <p className="text-muted">
              No documents found for employee {selectedEmployee.name} ({selectedEmployee.employee_id})
            </p>
            <div className="mt-4 bg-light rounded p-3 text-start">
              <h6 className="d-flex align-items-center">
                <FaExclamationTriangle className="text-warning me-2" />
                Next Steps
              </h6>
              <ul className="mb-0">
                <li>Confirm the employee has uploaded documents</li>
                <li>Check if documents are in another verification queue</li>
                <li>Contact the employee if necessary</li>
              </ul>
            </div>
          </Card.Body>
        </Card>
      )}

      {!isLoading && selectedEmployee && documents.length > 0 && filteredDocs.length === 0 && (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <div className="display-5 text-info mb-3">
              <FaFilter />
            </div>
            <h4>No Matching Documents</h4>
            <p className="text-muted">
              No documents match your current filters
            </p>
            <Button 
              variant="outline-primary"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Update Status Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Document Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentDocument && (
            <div className="mb-4">
              <h6>{currentDocument.document_name}</h6>
              <div className="d-flex gap-3 text-muted">
                <small>Type: {currentDocument.document_type}</small>
                <small>ID: {currentDocument.document_id}</small>
              </div>
            </div>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Verification Status</Form.Label>
              <Form.Select
                name="verification_status"
                value={formData.verification_status}
                onChange={handleFormChange}
                disabled={isUpdating}
              >
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Verification Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="verification_notes"
                value={formData.verification_notes}
                onChange={handleFormChange}
                placeholder="Add verification comments..."
                disabled={isUpdating}
              />
              <Form.Text className="text-muted">
                These notes will be visible to the employee
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={isUpdating} onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            disabled={isUpdating}
            onClick={handleUpdateStatus}
          >
            {isUpdating ? (
              <Spinner size="sm" animation="border" />
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DocumentVerificationAdmin;