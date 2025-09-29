import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./Teachers.css";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    tCode: "",
    department: "",
    gender: "Male",
    role: "Faculty",
    contact: "",
    email: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers");
      setTeachers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
      setLoading(false);
      showNotification("Error fetching teachers", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, formData);
        showNotification("Teacher updated successfully");
      } else {
        await api.post("/teachers", formData);
        showNotification("Teacher added successfully");
      }
      resetForm();
      fetchTeachers();
    } catch (error) {
      // console.error("❌ Error saving teacher:", error);
      showNotification("Error saving teacher", "error");
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      tCode: teacher.tCode,
      department: teacher.department,
      gender: teacher.gender,
      role: teacher.role,
      contact: teacher.contact,
      email: teacher.email,
    });
    setShowForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/teachers/${teacherId}`);
        showNotification("Teacher deleted successfully");
        fetchTeachers();
      } catch (error) {
        console.error("❌ Error deleting teacher:", error);
        showNotification("Error deleting teacher", "error");
      }
    }
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setFormData({
      name: "",
      tCode: "",
      department: "",
      gender: "Male",
      role: "Faculty",
      contact: "",
      email: "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTeacher(null);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async () => {
    if (!file) {
      showNotification("Please select a file", "warning");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      await api.post("/teachers/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification("Teachers uploaded successfully");
      fetchTeachers();
      setFile(null);
      // Reset file input
      document.querySelector(".file-input").value = "";
    } catch (error) {
      console.error(error);
      showNotification("Error uploading teachers", "error");
    }
  };

  if (loading) {
    return <div className="loading">Loading teachers...</div>;
  }

  return (
    <div className="teachers-container">
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="teachers-header">
        <h2>Teacher Management</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <span className="btn-icon">+</span> Add New Teacher
          </button>
          <div className="file-upload-section">
            <label className="file-input-label">
              <input
                type="file"
                className="file-input"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              📁 Upload Excel
            </label>
            {file && (
              <button className="btn btn-success" onClick={handleFileUpload}>
                Process {file.name}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="teacher-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teacher Code *</label>
                  <input
                    type="text"
                    value={formData.tCode}
                    onChange={(e) =>
                      setFormData({ ...formData, tCode: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="HOD">HOD</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">
                      Associate Professor
                    </option>
                    <option value="Assistant Professor">
                      Assistant Professor
                    </option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? "Update Teacher" : "Save Teacher"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teachers Table */}
      <div className="table-container">
        {teachers.length === 0 ? (
          <div className="empty-state">
            <h3>No teachers found</h3>
            <p>Add your first teacher to get started</p>
          </div>
        ) : (
          <table className="teachers-table">
            <thead>
              <tr>
                <th>Teacher Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Gender</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td>{teacher.tCode}</td>
                  <td>
                    <div className="teacher-name">
                      {teacher.name || "N/A"}
                      <span
                        className={`role-badge ${(teacher.role || "unknown")
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {teacher.role || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td>{teacher.email || "N/A"}</td>
                  <td>{teacher.department || "N/A"}</td>
                  <td>
                    <span
                      className={`gender-badge ${(
                        teacher.gender || "unknown"
                      ).toLowerCase()}`}
                    >
                      {teacher.gender || "Unknown"}
                    </span>
                  </td>
                  <td>{teacher.role || "Unknown"}</td>
                  <td>{teacher.contact || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(teacher)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(teacher._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Teachers;
