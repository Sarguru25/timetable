import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./UserManagement.css";
import api from "../../services/api";

const UserManagement = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("single");
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    password: "default123",
    department: "",

    // Student specific
    semester: 1,
    rollNumber: "",
    className: "",

    // Teacher specific
    tCode: "",
    gender: "Male",
    teacherRole: "Assistant Professor",
    contact: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);

  const roles = [
    { value: "student", label: "Student" },
    { value: "assistant_professor", label: "Assistant Professor" },
    { value: "associate_professor", label: "Associate Professor" },
    { value: "professor", label: "Professor" },
    { value: "hod", label: "Head of Department" },
  ];

  const teacherRoles = [
    "Assistant Professor",
    "Associate Professor",
    "Professor",
    "HOD",
  ];

  
  const departments = [
    "B.Com",
    "BBA"
  ];

  const genders = ["Male", "Female", "Other"];
  const semesters = [1, 2, 3, 4, 5, 6];

// ✅ Create single user
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    let payloadUserType = userType;
    let payloadUserData = formData;

    // If teacher, map teacherRole correctly
    if (userType === "teacher") {
      const roleMap = {
        "Assistant Professor": "assistant_professor",
        "Associate Professor": "associate_professor",
        "Professor": "professor",
        "HOD": "hod",
      };

      if (!roleMap[formData.teacherRole]) {
        throw new Error("Invalid teacher role selected");
      }

      payloadUserType = roleMap[formData.teacherRole];
      payloadUserData = {
        ...formData,
        teacherRole: formData.teacherRole, // ✅ fixed
      };
    }

    const response = await api.post(
      "/users/create",
      {
        userType: payloadUserType,
        userData: payloadUserData,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = response.data;

    if (result.success) {
      setMessage("✅ User created successfully!");
      resetForm();
      fetchUsers();
    } else {
      setMessage(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
  }

  setLoading(false);
};




// ✅ Bulk upload users via Excel
const handleBulkUpload = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    if (!bulkFile || !bulkType) {
      setMessage("Please select a file and type.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);

    const response = await api.post(
      `/users/bulk/${bulkType}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const result = response.data;

    if (result.success) {
      setMessage("✅ Bulk upload successful!");
      setBulkFile(null);
      fetchUsers();
    } else {
      setMessage(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
  }

  setLoading(false);
};


  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "default123",
      department: "",
      semester: 1,
      rollNumber: "",
      className: "",
      tCode: "",
      gender: "Male",
      teacherRole: "Assistant Professor",
      contact: "",
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = response.data;
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>Admin privileges required to access user management.</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>User Management</h2>
        <p>Create and manage system users</p>
      </div>

      <div className="management-tabs">
        <button
          className={activeTab === "single" ? "active" : ""}
          onClick={() => setActiveTab("single")}
        >
          Single User Creation
        </button>
        <button
          className={activeTab === "bulk" ? "active" : ""}
          onClick={() => setActiveTab("bulk")}
        >
          Bulk User Creation
        </button>
      </div>

      <div className="management-content">
        {activeTab === "single" ? (
          <div className="create-user-form">
            {/* <h3>Create New User</h3> */}

            <div className="user-type-selector">
              <label>Create login for:</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={userType === "student" ? "active" : ""}
                  onClick={() => setUserType("student")}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={userType === "teacher" ? "active" : ""}
                  onClick={() => setUserType("teacher")}
                >
                  Teacher/Staff
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {userType === "student" ? (
                  <>
                    <div className="form-group">
                      <label>Semester</label>
                      <select
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            semester: parseInt(e.target.value),
                          })
                        }
                        required
                      >
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={formData.teacherRole}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teacherRole: e.target.value,
                          })
                        }
                        required
                      >
                        {teacherRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="form-row">
                {userType === "student" ? (
                  <>
                    <div className="form-group">
                      <label>Roll Number</label>
                      <input
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rollNumber: e.target.value,
                          })
                        }
                        required
                        placeholder="Enter roll number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Class Name</label>
                      <input
                        type="text"
                        value={formData.className}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            className: e.target.value,
                          })
                        }
                        required
                        placeholder="Enter class name"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Teacher Code</label>
                      <input
                        type="text"
                        value={formData.tCode}
                        onChange={(e) =>
                          setFormData({ ...formData, tCode: e.target.value })
                        }
                        required
                        placeholder="Enter teacher code"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                      >
                        {genders.map((gender) => (
                          <option key={gender} value={gender}>
                            {gender}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {userType === "teacher" && (
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                    placeholder="Enter contact number"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  placeholder="Default password"
                />
                <small>Users should change this on first login</small>
              </div>

              <button type="submit" disabled={loading}>
                {loading
                  ? "Creating User..."
                  : `Create ${userType === "student" ? "Student" : "Teacher"}`}
              </button>
            </form>
          </div>
        ) : (
          <div className="bulk-creation">
            <h3>Bulk User Creation</h3>

            <div className="bulk-options">
              <div className="bulk-option">
                <h4>Bulk Student Creation</h4>
                <p>Upload Excel file with student data</p>
                <div className="file-upload">
                  <input type="file" id="students-file" accept=".xlsx, .xls" />
                  <button
                    onClick={(e) => handleBulkUpload(e, "students")}
                    disabled={loading}
                  >
                    {loading ? "Uploading..." : "Upload Students"}
                  </button>
                </div>
                <div className="template-info">
                  <p>
                    <strong>Excel Format for Students:</strong>
                  </p>
                  <ul>
                    <li>
                      Columns: name, email, department, semester, rollNumber,
                      className
                    </li>
                    <li>First row should contain headers</li>
                  </ul>
                  <button className="download-template">
                    Download Template
                  </button>
                </div>
              </div>

              <div className="bulk-option">
                <h4>Bulk Teacher Creation</h4>
                <p>Upload Excel file with teacher data</p>
                <div className="file-upload">
                  <input type="file" id="teachers-file" accept=".xlsx, .xls" />
                  <button
                    onClick={(e) => handleBulkUpload(e, "teachers")}
                    disabled={loading}
                  >
                    {loading ? "Uploading..." : "Upload Teachers"}
                  </button>
                </div>
                <div className="template-info">
                  <p>
                    <strong>Excel Format for Teachers:</strong>
                  </p>
                  <ul>
                    <li>
                      Columns: name, email, department, tCode, teacherRole,
                      gender, contact
                    </li>
                    <li>First row should contain headers</li>
                  </ul>
                  <button className="download-template">
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            {bulkResults && (
              <div className="bulk-results">
                <h4>Upload Results</h4>
                <div className="results-summary">
                  <p>Successful: {bulkResults.successful.length}</p>
                  <p>Errors: {bulkResults.errors.length}</p>
                </div>
                {bulkResults.errors.length > 0 && (
                  <div className="errors-list">
                    <h5>Errors:</h5>
                    <ul>
                      {bulkResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {message && (
          <div
            className={`message ${
              message.includes("Error") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}

        <div className="users-list">
          <h3>Existing Users</h3>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.department}</td>
                      <td>
                        {user.role === "student" ? "Student" : "Teacher/Staff"}
                      </td>
                      <td>
                        <span
                          className={`status ${
                            user.isActive ? "active" : "inactive"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="btn-edit">Edit</button>
                        <button className="btn-delete">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
