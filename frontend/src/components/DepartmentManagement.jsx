import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import "./Management.css";

const DepartmentManagement = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("departments");

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    hod: "",
  });
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Sample data - in real app, this would come from API
  const sampleDepartments = [
    {
      id: 1,
      name: "Computer Science",
      code: "CS",
      hod: "Dr. Smith",
      hodId: "t001",
      teacherCount: 15,
      studentCount: 300,
    },
    {
      id: 2,
      name: "Mathematics",
      code: "MATH",
      hod: "Dr. Johnson",
      hodId: "t002",
      teacherCount: 12,
      studentCount: 250,
    },
    {
      id: 3,
      name: "Physics",
      code: "PHY",
      hod: "Dr. Williams",
      hodId: "t003",
      teacherCount: 10,
      studentCount: 200,
    },
    {
      id: 4,
      name: "Chemistry",
      code: "CHEM",
      hod: "Dr. Brown",
      hodId: "t004",
      teacherCount: 8,
      studentCount: 180,
    },
  ];

  const sampleTeachers = [
    {
      id: "t001",
      name: "Dr. Smith",
      email: "smith@university.edu",
      department: "Computer Science",
      role: "professor",
    },
    {
      id: "t002",
      name: "Dr. Johnson",
      email: "johnson@university.edu",
      department: "Mathematics",
      role: "professor",
    },
    {
      id: "t003",
      name: "Dr. Williams",
      email: "williams@university.edu",
      department: "Physics",
      role: "professor",
    },
    {
      id: "t004",
      name: "Dr. Brown",
      email: "brown@university.edu",
      department: "Chemistry",
      role: "professor",
    },
    {
      id: "t005",
      name: "Dr. Davis",
      email: "davis@university.edu",
      department: "Computer Science",
      role: "associate_professor",
    },
  ];

  useEffect(() => {
    // Fetch departments and teachers from API
    fetchDepartments();
    fetchTeachers();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setDepartments(sampleDepartments);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage("Error fetching departments");
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Simulate API call
      setTeachers(sampleTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDepartment) {
        // Update existing department
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === editingDepartment.id
              ? { ...dept, ...departmentForm, hodId: departmentForm.hod }
              : dept
          )
        );
        setMessage("Department updated successfully!");
      } else {
        // Create new department
        const newDept = {
          id: departments.length + 1,
          ...departmentForm,
          hodId: departmentForm.hod,
          teacherCount: 0,
          studentCount: 0,
        };
        setDepartments((prev) => [...prev, newDept]);
        setMessage("Department created successfully!");
      }

      setDepartmentForm({ name: "", code: "", hod: "" });
      setEditingDepartment(null);
    } catch (error) {
      setMessage("Error saving department");
    }
    setLoading(false);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      code: department.code,
      hod: department.hodId,
    });
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        setDepartments((prev) =>
          prev.filter((dept) => dept.id !== departmentId)
        );
        setMessage("Department deleted successfully!");
      } catch (error) {
        setMessage("Error deleting department");
      }
    }
  };

  const resetForm = () => {
    setDepartmentForm({ name: "", code: "", hod: "" });
    setEditingDepartment(null);
  };

  // Filter professors for HOD assignment
  const availableHODs = teachers.filter((teacher) =>
    ["professor", "associate_professor"].includes(teacher.role)
  );

  if (!user || !isAdmin()) {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>Admin privileges required to access department management.</p>
      </div>
    );
  }

  return (
    <div className="department-management">
      <div className="management-header">
        <h2>Department Management</h2>
        <p>Manage academic departments and assign HODs</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${
            activeTab === "departments" ? "active" : ""
          }`}
          onClick={() => setActiveTab("departments")}
        >
          📊 Departments
        </button>
        <button
          className={`tab-button ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          ➕ {editingDepartment ? "Edit Department" : "Create Department"}
        </button>
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("Error") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      {activeTab === "departments" && (
        <div className="departments-list">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Departments</h3>
              <p className="count">{departments.length}</p>
            </div>
            <div className="summary-card">
              <h3>Total Faculty</h3>
              <p className="count">
                {departments.reduce((sum, dept) => sum + dept.teacherCount, 0)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Total Students</h3>
              <p className="count">
                {departments.reduce((sum, dept) => sum + dept.studentCount, 0)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading departments...</div>
          ) : (
            <div className="departments-table">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Head of Department</th>
                    <th>Faculty</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No departments found. Create your first department.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>
                          <strong>{dept.name}</strong>
                        </td>
                        <td>{dept.code}</td>
                        <td>
                          {dept.hod ? (
                            <span className="hod-info">
                              {dept.hod}
                              <span className="hod-badge">HOD</span>
                            </span>
                          ) : (
                            <span className="no-hod">Not assigned</span>
                          )}
                        </td>
                        <td>{dept.teacherCount} teachers</td>
                        <td>{dept.studentCount} students</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditDepartment(dept)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteDepartment(dept.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="create-department-form">
          <div className="form-header">
            <h3>
              {editingDepartment ? "Edit Department" : "Create New Department"}
            </h3>
            {editingDepartment && (
              <button className="btn-cancel" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleDepartmentSubmit}>
            <div className="form-group">
              <label htmlFor="deptName">Department Name</label>
              <input
                type="text"
                id="deptName"
                value={departmentForm.name}
                onChange={(e) =>
                  setDepartmentForm({ ...departmentForm, name: e.target.value })
                }
                placeholder="e.g., Computer Science"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deptCode">Department Code</label>
              <input
                type="text"
                id="deptCode"
                value={departmentForm.code}
                onChange={(e) =>
                  setDepartmentForm({
                    ...departmentForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., CS"
                maxLength="10"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hodSelect">Head of Department (HOD)</label>
              <select
                id="hodSelect"
                value={departmentForm.hod}
                onChange={(e) =>
                  setDepartmentForm({ ...departmentForm, hod: e.target.value })
                }
              >
                <option value="">Select HOD</option>
                {availableHODs.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.department})
                  </option>
                ))}
              </select>
              <small>
                Only Professors and Associate Professors can be assigned as HOD
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingDepartment
                  ? "Update Department"
                  : "Create Department"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Reset
              </button>
            </div>
          </form>

          {editingDepartment && (
            <div className="current-assignment">
              <h4>Current Assignment</h4>
              <p>
                <strong>Department:</strong> {editingDepartment.name}
              </p>
              <p>
                <strong>Current HOD:</strong>{" "}
                {editingDepartment.hod || "Not assigned"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
