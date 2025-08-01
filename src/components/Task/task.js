import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "./task.css";
import moment from "moment";
import { toast, ToastContainer } from "react-toastify";
import {
  FaCheckCircle,
  FaClock,
  FaTasks,
  FaSyncAlt,
  FaChevronDown,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Dropdown, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/employee/get-tasks");
      setTasks(res.data.tasks || []);
      setLoading(false);
      toast.success("Tasks updated successfully!");
    } catch (err) {
      toast.error("Error fetching tasks. Please try again.");
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const res = await api.put(`/employee/update-task-status/${taskId}`, {
        status,
      });
      toast.success(`Task marked as ${status}`);
      fetchTasks();
    } catch (err) {
      toast.error("Failed to update task status.");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="container mt-5 p-4 bg-white shadow rounded-4 border">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h3 className="text-primary fw-bold mb-0 d-flex align-items-center">
          <FaTasks className="me-2" />
          Task Management
        </h3>
        <Button variant="outline-primary" className="d-flex align-items-center gap-2" onClick={fetchTasks}>
          <FaSyncAlt /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3">Loading your assigned tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="alert alert-info text-center">
          <FaExclamationTriangle className="me-2" />
          No tasks found.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Task ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Assigned By</th>
                <th>Assigned Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => {
                const isOverdue = moment().isAfter(moment(task.due_date, "DD-MM-YYYY"));
                const dueDateFormatted = moment(task.due_date, "DD-MM-YYYY").format("DD/MM/YYYY");
                const assignedDateFormatted = moment(task.assigned_date, "DD-MM-YYYY").format("DD/MM/YYYY");

                return (
                  <tr key={task.task_id}>
                    <td>{index + 1}</td>
                    <td className="fw-medium">{task.task_id}</td>
                    <td className="fw-semibold text-primary text-decoration-underline cursor-pointer">
                      {task.title}
                    </td>
                    <td style={{ maxWidth: "250px" }}>{task.description}</td>
                    <td className="text-capitalize">{task.assigned_by?.name}</td>
                    <td>{assignedDateFormatted}</td>
                    <td className={isOverdue ? "text-danger fw-semibold" : ""}>
                      {dueDateFormatted}
                      {isOverdue && (
                        <span className="ms-1 text-danger">
                          <FaExclamationTriangle />
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-3 py-2 fs-6 ${
                          task.status === "Completed"
                            ? "bg-success"
                            : task.status === "Pending"
                            ? "bg-warning text-dark"
                            : "bg-secondary"
                        }`}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="secondary" size="sm" className="d-flex align-items-center">
                          Update <FaChevronDown className="ms-2" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => updateStatus(task.task_id, "Completed")}>
                            <FaCheckCircle className="me-2 text-success" /> Mark as Completed
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => updateStatus(task.task_id, "Pending")}>
                            <FaClock className="me-2 text-warning" /> Mark as Pending
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Task;
