
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Card, Button, Table, Form, Row, Col, 
  Spinner, Badge, Modal, Dropdown, Alert
} from 'react-bootstrap';
import { 
  FaUpload, FaTrash, FaSearch, FaFilePdf, 
  FaFileWord, FaFileImage,
  FaFileAlt, FaEdit, FaCheck, FaInfoCircle,
  FaCloudDownloadAlt, FaExclamationTriangle
} from 'react-icons/fa';

const DocumentsAndBankDetails = () => {
  // Document states
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentStatusFilter, setDocumentStatusFilter] = useState('All Status');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All Types');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Bank details states
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    uan_number: '',
    pf_number: ''
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(true);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankError, setBankError] = useState(null);
  
  // Document types
  const documentTypes = [
    'PAN Card', 'Aadhaar Card', 'Resume', 
    'Certificate', 'Criminal Conduct Certificate', 
    'Digital Responsibility Certificate', 'Other'
  ];

  // Document statuses
  const documentStatuses = [
    'Approved', 'Pending', 'Rejected'
  ];

  // Fetch documents from API
  const fetchDocuments = async () => {
    setIsDocumentsLoading(true);
    try {
      const response = await api.get('/employee/get-documents');
      if (response.data?.documents) {
        const mappedDocs = response.data.documents.map(doc => ({
          ...doc,
          status: doc.verification_status,
          upload_date: doc.uploaded_at
        }));
        
        setDocuments(mappedDocs);
        setFilteredDocuments(mappedDocs);
      }
    } catch (err) {
      toast.error('❌ Failed to load documents');
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  // Fetch bank details from API with proper 404 handling
  const fetchBankDetails = async () => {
    setIsBankLoading(true);
    setBankError(null);
    
    try {
      const response = await api.get('/employee/get-bank-details');
      if (response.data?.data) {
        setBankDetails(response.data.data);
        setHasBankDetails(true);
      } else {
        // Initialize empty bank details if none exist
        setBankDetails({
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          uan_number: '',
          pf_number: ''
        });
        setHasBankDetails(false);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // Bank details don't exist yet
        setBankDetails({
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          uan_number: '',
          pf_number: ''
        });
        setHasBankDetails(false);
      } else {
        setBankError('Failed to load bank details. Please try again later.');
        console.error('Bank details fetch error:', err);
      }
    } finally {
      setIsBankLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchBankDetails();
  }, []);

  // Filter documents based on search and filters
  useEffect(() => {
    let result = documents;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.document_name.toLowerCase().includes(term) ||
        doc.document_type.toLowerCase().includes(term)
      );
    }
    
    if (documentTypeFilter !== 'All Types') {
      result = result.filter(doc => doc.document_type === documentTypeFilter);
    }
    
    if (documentStatusFilter !== 'All Status') {
      result = result.filter(doc => doc.status === documentStatusFilter);
    }
    
    setFilteredDocuments(result);
  }, [searchTerm, documentTypeFilter, documentStatusFilter, documents]);

  // Handle document upload
  const handleDocumentUpload = async () => {
    if (!documentType || !documentName || !googleDriveUrl) {
      toast.warning('⚠️ Please fill all document fields');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('document_name', documentName);
      formData.append('google_drive_url', googleDriveUrl);
      
      await api.post('/employee/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('✅ Document uploaded successfully');
      fetchDocuments();
      setShowUploadModal(false);
      setDocumentType('');
      setDocumentName('');
      setGoogleDriveUrl('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Failed to upload document';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/employee/delete-document/${docId}`);
        toast.success('✅ Document deleted successfully');
        fetchDocuments();
      } catch (err) {
        toast.error('❌ Failed to delete document');
      }
    }
  };

  // Handle bank details create/update
  const handleBankUpdate = async () => {
    // Validate required fields
    if (!bankDetails.bank_name || !bankDetails.account_number || !bankDetails.ifsc_code) {
      toast.warning('⚠️ Please fill required bank fields');
      return;
    }
    
    setIsSavingBank(true);
    
    try {
      if (hasBankDetails) {
        // Update existing bank details
        await api.put('/employee/update/BankDetails', bankDetails);
        toast.success('✅ Bank details updated successfully');
      } else {
        // Create new bank details
        await api.post('/employee/upload-bank-details', bankDetails);
        toast.success('✅ Bank details saved successfully');
        setHasBankDetails(true);
      }
      
      setIsEditingBank(false);
      fetchBankDetails(); // Refresh bank details
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Failed to save bank details';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsSavingBank(false);
    }
  };

  // Get icon for document type
  const getDocumentIcon = (type) => {
    if (type.includes('PAN') || type.includes('Card')) return <FaFileImage className="text-primary" />;
    if (type === 'Resume') return <FaFileWord className="text-info" />;
    if (type.includes('Certificate')) return <FaFilePdf className="text-danger" />;
    return <FaFileAlt className="text-secondary" />;
  };

  // Get badge for document status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <Badge bg="success" className="py-1 px-2 rounded-pill">{status}</Badge>;
      case 'Pending':
        return <Badge bg="warning" text="dark" className="py-1 px-2 rounded-pill">{status}</Badge>;
      case 'Rejected':
        return <Badge bg="danger" className="py-1 px-2 rounded-pill">{status}</Badge>;
      default:
        return <Badge bg="secondary" className="py-1 px-2 rounded-pill">{status}</Badge>;
    }
  };

  // Render bank details section
  const renderBankDetails = () => {
    if (isBankLoading) {
      return (
        <div className="d-flex justify-content-center py-4">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }
    
    if (bankError) {
      return (
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div>{bankError}</div>
          <Button 
            variant="link" 
            size="sm" 
            className="ms-auto p-0"
            onClick={fetchBankDetails}
          >
            Retry
          </Button>
        </Alert>
      );
    }
    
    return (
      <Form>
        {!hasBankDetails && (
          <Alert variant="info" className="d-flex align-items-center">
            <FaInfoCircle className="me-2" />
            <div>You haven't added your bank details yet</div>
          </Alert>
        )}
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-medium text-muted">Bank Name <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter bank name"
            value={bankDetails.bank_name}
            onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
            readOnly={!isEditingBank}
            required
            className="border-0 bg-light py-2"
          />
        </Form.Group>
        
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-muted">Account Number <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter account number"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                readOnly={!isEditingBank}
                required
                className="border-0 bg-light py-2"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-muted">IFSC Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter IFSC code"
                value={bankDetails.ifsc_code}
                onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value})}
                readOnly={!isEditingBank}
                required
                className="border-0 bg-light py-2"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-medium text-muted">UAN Number</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter UAN number"
            value={bankDetails.uan_number}
            onChange={(e) => setBankDetails({...bankDetails, uan_number: e.target.value})}
            readOnly={!isEditingBank}
            className="border-0 bg-light py-2"
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label className="fw-medium text-muted">PF Number</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter PF number"
            value={bankDetails.pf_number}
            onChange={(e) => setBankDetails({...bankDetails, pf_number: e.target.value})}
            readOnly={!isEditingBank}
            className="border-0 bg-light py-2"
          />
        </Form.Group>
        
        <div className="d-flex justify-content-between align-items-center mt-4 pt-2">
          {!isEditingBank ? (
            <Button 
              variant="primary" 
              onClick={() => setIsEditingBank(true)}
              className="rounded-pill px-3"
            >
              <FaEdit className="me-1" /> {hasBankDetails ? 'Edit Details' : 'Add Bank Details'}
            </Button>
          ) : (
            <div className="d-flex gap-2 ms-auto">
              <Button 
                variant="outline-secondary" 
                onClick={() => setIsEditingBank(false)}
                className="rounded-pill px-3"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleBankUpdate}
                className="rounded-pill px-3"
                disabled={isSavingBank}
              >
                {isSavingBank ? (
                  <Spinner size="sm" animation="border" className="me-2" />
                ) : (
                  <FaCheck className="me-1" />
                )}
                {hasBankDetails ? 'Update' : 'Save'} Details
              </Button>
            </div>
          )}
          
          {hasBankDetails && !isEditingBank && (
            <div className="ms-2">
              <Badge bg="success" className="py-2 px-3 rounded-pill">
                <FaCheck className="me-1" /> Details Verified
              </Badge>
            </div>
          )}
        </div>
      </Form>
    );
  };

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1 fw-bold text-primary">Documents & Bank Details</h1>
          <p className="text-muted mb-0">Manage your uploaded documents and bank information</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowUploadModal(true)}
          className="d-flex align-items-center shadow-sm"
        >
          <FaUpload className="me-2" /> Upload Document
        </Button>
      </div>
      
      <Row>
        {/* Documents Section */}
        <Col md={8} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center py-3 gap-2 border-bottom">
              <h5 className="mb-0 fw-semibold">Document Management</h5>
              <div className="d-flex flex-wrap gap-2">
                <div className="d-flex align-items-center position-relative">
                  <FaSearch className="position-absolute ms-2 text-muted" />
                  <Form.Control
                    type="text"
                    placeholder="Search documents..."
                    className="ps-4 border-0 bg-light rounded-pill"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" className="rounded-pill border-0 bg-light">
                      {documentTypeFilter}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm">
                      <Dropdown.Item 
                        onClick={() => setDocumentTypeFilter('All Types')}
                        className={documentTypeFilter === 'All Types' ? 'active' : ''}
                      >
                        All Types
                      </Dropdown.Item>
                      {documentTypes.map(type => (
                        <Dropdown.Item 
                          key={type} 
                          onClick={() => setDocumentTypeFilter(type)}
                          className={documentTypeFilter === type ? 'active' : ''}
                        >
                          {type}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" className="rounded-pill border-0 bg-light">
                      {documentStatusFilter}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm">
                      <Dropdown.Item 
                        onClick={() => setDocumentStatusFilter('All Status')}
                        className={documentStatusFilter === 'All Status' ? 'active' : ''}
                      >
                        All Status
                      </Dropdown.Item>
                      {documentStatuses.map(status => (
                        <Dropdown.Item 
                          key={status} 
                          onClick={() => setDocumentStatusFilter(status)}
                          className={documentStatusFilter === status ? 'active' : ''}
                        >
                          {status}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {isDocumentsLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-5">
                  <FaFileAlt size={48} className="text-muted mb-3" />
                  <h5>No documents found</h5>
                  <p className="text-muted">Upload documents to get started</p>
                  <Button 
                    variant="outline-primary" 
                    className="mt-2"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <FaUpload className="me-2" /> Upload Document
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-4">Document</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Upload Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="me-3 fs-5">
                                {getDocumentIcon(doc.document_type)}
                              </div>
                              <div>
                                <div className="fw-medium">{doc.document_name}</div>
                                <a 
                                  href={doc.google_drive_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-decoration-none small d-flex align-items-center text-primary"
                                >
                                  <FaCloudDownloadAlt className="me-1" /> View Document
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-light text-dark border">
                              {doc.document_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {doc.upload_date || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="rounded-circle p-1 shadow-sm"
                              onClick={() => handleDeleteDocument(doc.document_id)}
                              disabled={doc.status === 'Approved'}
                              title={doc.status === 'Approved' ? 'Cannot delete approved documents' : ''}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Bank Details Section */}
        <Col md={4}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
              <h5 className="mb-0 fw-semibold">Bank Details</h5>
              {hasBankDetails && !isEditingBank && (
                <div className="d-flex align-items-center">
                  <span className="badge bg-light text-success border border-success me-2">
                    <FaCheck className="me-1" /> Saved
                  </span>
                </div>
              )}
            </Card.Header>
            <Card.Body>
              {renderBankDetails()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Upload Document Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Upload New Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Document Type <span className="text-danger">*</span></Form.Label>
              <Form.Select 
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
                className="border-0 bg-light py-2"
              >
                <option value="">Select document type</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Document Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., PAN2025.pdf"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
                className="border-0 bg-light py-2"
              />
              <Form.Text className="text-muted">
                Enter a descriptive name for your document
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Google Drive URL <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={googleDriveUrl}
                onChange={(e) => setGoogleDriveUrl(e.target.value)}
                required
                className="border-0 bg-light py-2"
              />
              <Form.Text className="text-muted">
                Upload your document to Google Drive and paste the shareable link here
              </Form.Text>
              
              <div className="alert alert-info mt-3 d-flex align-items-center">
                <FaInfoCircle className="me-2 fs-5" />
                <div>Make sure your Google Drive file has link sharing enabled</div>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button 
            variant="light" 
            onClick={() => setShowUploadModal(false)} 
            disabled={isUploading}
            className="rounded-pill px-4"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDocumentUpload}
            disabled={isUploading}
            className="rounded-pill px-4"
          >
            {isUploading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <FaUpload className="me-1" />
            )}
            Upload Document
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DocumentsAndBankDetails;