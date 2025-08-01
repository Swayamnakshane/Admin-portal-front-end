// src/components/Dashboard/DashboardHome.js
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Row, Col, ProgressBar, Badge, 
  Spinner, Alert
} from 'react-bootstrap';
import { 
  FaTasks, FaClock, FaFileAlt, FaUserGraduate, 
  FaProjectDiagram, FaCalendarAlt, FaChartLine, 
  FaUsers, FaSyncAlt, FaBriefcase, FaIndustry,
  FaExclamationTriangle, FaTools
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import moment from 'moment';
import api from "../api/api";

import './Dashboard.css';

const DashboardHome = () => {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const userName = localStorage.getItem("name") || "Employee";
    setName(userName);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [tasksRes, timesheetRes, documentsRes, trainingRes, meetingsRes] = await Promise.all([
        api.get('/employee/get-tasks'),
        api.get('/employee/summary/get-timesheet'),
        api.get('/employee/get-documents'),
        api.get('/employee/training/my-trainings'),
        api.get('/employee/get-meetings')
      ]);
      
      // Calculate task statistics
      const tasks = tasksRes.data.tasks || [];
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      
      // Calculate document statistics
      const documents = documentsRes.data.documents || [];
      const docStatusCount = documents.reduce((acc, doc) => {
        acc[doc.verification_status] = (acc[doc.verification_status] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate training progress
      const trainings = trainingRes.data || [];
      const totalProgress = trainings.reduce((sum, training) => {
        const start = moment(training.start_date);
        const end = moment(training.end_date);
        const today = moment();
        
        if (today.isAfter(end) || training.status === "Completed") return sum + 100;
        if (today.isBefore(start)) return sum;
        
        const totalDays = end.diff(start, "days");
        const daysPassed = today.diff(start, "days");
        return sum + Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
      }, 0);
      const avgTrainingProgress = trainings.length ? Math.round(totalProgress / trainings.length) : 0;
      
      // Timesheet data
      const timesheetSummary = timesheetRes.data;
      
      // Today's timesheet progress
      const today = moment().format("YYYY-MM-DD");
      let todayProgress = 0;
      try {
        const dailyRes = await api.get('/employee/daily/get-timesheet', { params: { date: today } });
        if (dailyRes.data) {
          todayProgress = Math.min(100, (dailyRes.data.total_hours / 8) * 100);
        }
      } catch (err) {
        // No timesheet for today is okay
      }
      
      // Meetings data
      const meetings = meetingsRes.data?.meetings || [];
      const todayStart = moment().startOf('day');
      const todayEnd = moment().endOf('day');
      
      const todayMeetings = meetings.filter(meeting => {
        const meetingDate = moment(meeting.date_time, "DD-MM-YYYY HH:mm");
        return meetingDate.isBetween(todayStart, todayEnd) && meeting.status !== "Completed";
      });
      
      const upcomingMeetings = meetings.filter(meeting => {
        const meetingDate = moment(meeting.date_time, "DD-MM-YYYY HH:mm");
        return meetingDate.isAfter(todayEnd) && meeting.status !== "Completed";
      });
      
      setDashboardData({
        tasks: {
          total: tasks.length,
          pending: tasks.length - completedTasks,
          completed: completedTasks
        },
        timesheet: {
          weeklyTotal: timesheetSummary.weekly_total || 0,
          weeklyAvg: timesheetSummary.weekly_avg || 0,
          todayProgress
        },
        documents: {
          total: documents.length,
          approved: docStatusCount.Approved || 0,
          pending: docStatusCount.Pending || 0,
          rejected: docStatusCount.Rejected || 0
        },
        training: {
          enrolled: trainings.length,
          progress: avgTrainingProgress
        },
        meetings: {
          today: todayMeetings.length,
          upcoming: upcomingMeetings.length,
          nextMeetings: todayMeetings.slice(0, 2).map(m => ({
            title: m.title,
            time: moment(m.date_time, "DD-MM-YYYY HH:mm").format("h:mm A"),
            location: m.meeting_type === "Virtual" ? "Virtual Meeting" : "Conference Room"
          }))
        },
        // Projects data - static since no endpoint exists
        projects: { 
          active: 0
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-home text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <h5 className="mt-3">Loading your industrial dashboard...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-home py-4">
        <Alert variant="danger" className="text-center">
          <FaExclamationTriangle className="me-2" />
          {error}
          <div className="mt-3">
            <Button variant="outline-primary" onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      {/* Welcome Header */}
      <div className="dashboard-header bg-gradient-primary text-white p-4 mb-4 rounded-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-6 fw-bold mb-1">{greeting}, {name}</h1>
            <p className="mb-0 opacity-75">Industrial Operations Dashboard</p>
          </div>
          <div className="d-flex align-items-center">
            <div className="bg-light text-primary rounded-circle p-3 me-2">
              <FaIndustry size={24} />
            </div>
            <Button 
              variant="light" 
              className="d-flex align-items-center"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner size="sm" animation="border" className="me-2" />
              ) : (
                <FaSyncAlt className="me-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics mb-4">
        <Row>
          <Col md={3} sm={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-primary-subtle p-3 rounded-circle me-3">
                  <FaChartLine className="text-primary fs-3" />
                </div>
                <div>
                  <Card.Title className="text-muted small mb-1">Operational Efficiency</Card.Title>
                  <h3 className="mb-0 fw-bold">87.4%</h3>
                  <Badge bg="success" className="mt-1">+2.1%</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-info-subtle p-3 rounded-circle me-3">
                  <FaUsers className="text-info fs-3" />
                </div>
                <div>
                  <Card.Title className="text-muted small mb-1">Team Productivity</Card.Title>
                  <h3 className="mb-0 fw-bold">92%</h3>
                  <Badge bg="success" className="mt-1">+3.5%</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-warning-subtle p-3 rounded-circle me-3">
                  <FaTools className="text-warning fs-3" />
                </div>
                <div>
                  <Card.Title className="text-muted small mb-1">Active Shifts</Card.Title>
                  <h3 className="mb-0 fw-bold">3</h3>
                  <Badge bg="primary" className="mt-1">All Active</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="bg-success-subtle p-3 rounded-circle me-3">
                  <FaCalendarAlt className="text-success fs-3" />
                </div>
                <div>
                  <Card.Title className="text-muted small mb-1">Today's Meetings</Card.Title>
                  <h3 className="mb-0 fw-bold">{dashboardData.meetings.today}</h3>
                  <Badge bg="info" className="mt-1">{dashboardData.meetings.upcoming} upcoming</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Dashboard Cards */}
      <Row className="g-4">
        {/* Tasks Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaTasks className="me-2" />
                <span className="fw-bold">Tasks</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {dashboardData.tasks.pending} Pending
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="mb-0">Task Management</h5>
                  <p className="text-muted small mb-0">Your assigned tasks</p>
                </div>
                <h2 className="mb-0 text-primary">{dashboardData.tasks.total}</h2>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Progress</small>
                  <small className="fw-bold">
                    {dashboardData.tasks.total ? 
                      Math.round((dashboardData.tasks.completed / dashboardData.tasks.total) * 100) : 0
                    }%
                  </small>
                </div>
                <ProgressBar 
                  now={dashboardData.tasks.total ? 
                    (dashboardData.tasks.completed / dashboardData.tasks.total) * 100 : 0
                  } 
                  variant="primary"
                  className="rounded-pill"
                  style={{ height: '8px' }}
                />
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <div className="bg-success rounded-circle me-2" style={{ width: '10px', height: '10px' }}></div>
                    <small>Completed: {dashboardData.tasks.completed}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-warning rounded-circle me-2" style={{ width: '10px', height: '10px' }}></div>
                    <small>Pending: {dashboardData.tasks.pending}</small>
                  </div>
                </div>
                <Button 
                  as={Link} 
                  to="/dashboard/tasks" 
                  variant="outline-primary" 
                  className="d-flex align-items-center"
                >
                  View Tasks
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Timesheet Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaClock className="me-2" />
                <span className="fw-bold">Timesheet</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {Math.round(dashboardData.timesheet.todayProgress)}% Today
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="mb-0">Time Tracking</h5>
                  <p className="text-muted small mb-0">Your work hours</p>
                </div>
                <h2 className="mb-0 text-info">{dashboardData.timesheet.weeklyTotal} hrs</h2>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Today's Progress</small>
                  <small className="fw-bold">{Math.round(dashboardData.timesheet.todayProgress)}%</small>
                </div>
                <ProgressBar 
                  now={dashboardData.timesheet.todayProgress} 
                  variant="info"
                  className="rounded-pill"
                  style={{ height: '8px' }}
                />
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <small>Weekly Average: {dashboardData.timesheet.weeklyAvg} hrs/day</small>
                  </div>
                </div>
                <Button 
                  as={Link} 
                  to="/dashboard/timesheet" 
                  variant="outline-info" 
                  className="d-flex align-items-center"
                >
                  View Timesheet
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Documents Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-warning text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaFileAlt className="me-2" />
                <span className="fw-bold">Documents</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {dashboardData.documents.total} Files
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="mb-0">Document Hub</h5>
                  <p className="text-muted small mb-0">Your uploaded files</p>
                </div>
                <h2 className="mb-0 text-warning">{dashboardData.documents.approved} Approved</h2>
              </div>
              <div className="d-flex justify-content-around mb-4">
                <div className="text-center">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1" 
                    style={{ width: '50px', height: '50px' }}>
                    <span className="text-white fw-bold">{dashboardData.documents.approved}</span>
                  </div>
                  <small className="text-muted">Approved</small>
                </div>
                <div className="text-center">
                  <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1" 
                    style={{ width: '50px', height: '50px' }}>
                    <span className="text-white fw-bold">{dashboardData.documents.pending}</span>
                  </div>
                  <small className="text-muted">Pending</small>
                </div>
                <div className="text-center">
                  <div className="bg-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1" 
                    style={{ width: '50px', height: '50px' }}>
                    <span className="text-white fw-bold">{dashboardData.documents.rejected}</span>
                  </div>
                  <small className="text-muted">Rejected</small>
                </div>
              </div>
              <Button 
                as={Link} 
                to="/dashboard/documents" 
                variant="outline-warning" 
                className="w-100 d-flex align-items-center justify-content-center"
              >
                Manage Documents
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Training Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaUserGraduate className="me-2" />
                <span className="fw-bold">Training</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {dashboardData.training.enrolled} Enrolled
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="mb-0">Learning Center</h5>
                  <p className="text-muted small mb-0">Your training progress</p>
                </div>
                <h2 className="mb-0 text-success">{dashboardData.training.progress}%</h2>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Current Progress</small>
                  <small className="fw-bold">{dashboardData.training.progress}%</small>
                </div>
                <ProgressBar 
                  now={dashboardData.training.progress} 
                  variant="success"
                  className="rounded-pill"
                  style={{ height: '8px' }}
                />
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="d-flex align-items-center mb-1">
                    <small>Enrolled trainings: {dashboardData.training.enrolled}</small>
                  </div>
                </div>
                <Button 
                  as={Link} 
                  to="/dashboard/training&learning" 
                  variant="outline-success" 
                  className="d-flex align-items-center"
                >
                  View Training
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Projects Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaProjectDiagram className="me-2" />
                <span className="fw-bold">Projects</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {dashboardData.projects.active} Active
              </Badge>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center py-5">
              <div className="bg-light text-secondary rounded-circle p-4 mb-4">
                <FaProjectDiagram size={36} />
              </div>
              <h5 className="mb-3">No Active Projects</h5>
              <p className="text-muted mb-4">
                This page will be available once you're allotted to a project
              </p>
              <Button 
                variant="outline-secondary" 
                className="d-flex align-items-center"
                disabled
              >
                View Projects
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Meetings Card */}
        <Col lg={4} md={6}>
          <Card className="card-hover h-100">
            <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <FaCalendarAlt className="me-2" />
                <span className="fw-bold">Meetings</span>
              </div>
              <Badge bg="light" text="dark" className="fs-6">
                {dashboardData.meetings.today} Today
              </Badge>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h5 className="mb-0">Meeting Schedule</h5>
                  <p className="text-muted small mb-0">Your upcoming meetings</p>
                </div>
                <h2 className="mb-0 text-danger">{dashboardData.meetings.upcoming} Upcoming</h2>
              </div>
              
              <div className="mb-3">
                {dashboardData.meetings.today === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <FaCalendarAlt className="mb-2" size={24} />
                    <p>No meetings scheduled for today</p>
                  </div>
                ) : (
                  dashboardData.meetings.nextMeetings.map((meeting, index) => (
                    <div key={index} className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                      <div className="bg-primary text-white rounded p-2 me-3">
                        <span className="fw-bold">{meeting.time}</span>
                      </div>
                      <div>
                        <div className="fw-bold">{meeting.title}</div>
                        <small className="text-muted">{meeting.location}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <Button 
                as={Link} 
                to="/dashboard/meetings" 
                variant="outline-danger" 
                className="w-100 d-flex align-items-center justify-content-center"
              >
                View Meetings
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardHome;