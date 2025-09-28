import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Management.css';
import api from '../services/api';


const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjectsCanTeach: [],
    maxHoursPerDay: 4,
    maxHoursPerWeek: 20,
    isHOD: false
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

<<<<<<< Updated upstream
const fetchTeachers = async () => {
  try {
    console.log("📡 Fetching teachers...");
    const response = await api.get('/teachers');  // since your backend is /api/teachers
    console.log("✅ Response:", response.data);
    setTeachers(response.data);
    setLoading(false);
  } catch (error) {
    console.error('❌ Error fetching teachers:', error);
    setLoading(false);
  }
};
=======
  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showNotification("Error fetching teachers", "error");
    } finally {
      setLoading(false);
    }
  };
>>>>>>> Stashed changes


const fetchSubjects = async () => {
  try {
    const response = await api.get('/subjects');
    console.log("📡 Subjects API response:", response.data);
    setSubjects(response.data);
  } catch (error) {
    console.error("❌ Error fetching subjects:", error);
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingTeacher) {
      await api.put(`/teachers/${editingTeacher._id}`, formData);
    } else {
      await api.post('/teachers', formData);
    }
    resetForm();
    fetchTeachers();
  } catch (error) {
    console.error('Error saving teacher:', error);
  }
};

const handleEdit = (teacher) => {
  setEditingTeacher(teacher);
  setFormData({
    name: teacher.name,
    email: teacher.email,
    subjectsCanTeach: teacher.subjectsCanTeach || [],
    maxHoursPerDay: teacher.maxHoursPerDay,
    maxHoursPerWeek: teacher.maxHoursPerWeek,
    isHOD: teacher.isHOD || false,
  });
  setShowForm(true);
};

const handleDelete = async (teacherId) => {
  if (window.confirm('Are you sure you want to delete this teacher?')) {
    try {
      await api.delete(`/teachers/${teacherId}`);
      fetchTeachers();
    } catch (error) {
<<<<<<< Updated upstream
      console.error('Error deleting teacher:', error);
    }
  }
};
=======
      console.error("Error saving teacher:", error);
      showNotification("Error saving teacher", "error");
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      tCode: teacher.tCode || "",
      department: teacher.department || "",
      gender: teacher.gender || "Other",
      role: teacher.role || "Faculty",
      contact: teacher.contact || "",
      email: teacher.email || "",
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
        console.error("Error deleting teacher:", error);
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
>>>>>>> Stashed changes

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      subjectsCanTeach: [],
      maxHoursPerDay: 4,
      maxHoursPerWeek: 20,
      isHOD: false
    });
    setEditingTeacher(null);
    setShowForm(false);
  };

<<<<<<< Updated upstream
  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjectsCanTeach: prev.subjectsCanTeach.includes(subjectId)
        ? prev.subjectsCanTeach.filter(id => id !== subjectId)
        : [...prev.subjectsCanTeach, subjectId]
    }));
  };

  if (loading) return <div className="loading">Loading teachers...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Manage Teachers</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Teacher'}
        </button>
=======
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
      document.querySelector('.file-input').value = "";
    } catch (error) {
      console.error(error);
      showNotification("Error uploading teachers", "error");
    }
  };

  if (loading) return <div className="loading">Loading teachers...</div>;

  // Helper to safely generate class names
  const safeClassName = (val, fallback) => (val ? val.toLowerCase().replace(/\s+/g, "-") : fallback);

  return (
    <div className="teachers-container">
      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
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
>>>>>>> Stashed changes
      </div>

      {showForm && (
<<<<<<< Updated upstream
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
=======
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="teacher-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teacher Code *</label>
                  <input
                    type="text"
                    value={formData.tCode}
                    onChange={(e) => setFormData({ ...formData, tCode: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="HOD">HOD</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? "Update Teacher" : "Save Teacher"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
>>>>>>> Stashed changes
          </div>
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Subjects They Can Teach</label>
            <div className="checkbox-group">
              {subjects.map(subject => (
                <label key={subject._id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.subjectsCanTeach.includes(subject._id)}
                    onChange={() => handleSubjectToggle(subject._id)}
                  />
                  {subject.name}
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Max Hours Per Day</label>
              <input
                type="number"
                value={formData.maxHoursPerDay}
                onChange={(e) => setFormData({...formData, maxHoursPerDay: parseInt(e.target.value)})}
                min="1"
                max="8"
              />
            </div>
            
            <div className="form-group">
              <label>Max Hours Per Week</label>
              <input
                type="number"
                value={formData.maxHoursPerWeek}
                onChange={(e) => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value)})}
                min="1"
                max="40"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isHOD}
                onChange={(e) => setFormData({...formData, isHOD: e.target.checked})}
              />
              Head of Department (HOD)
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="management-list">
        {teachers.length === 0 ? (
          <div className="empty-state">
            <h3>No teachers found</h3>
            <p>Add your first teacher to get started</p>
          </div>
        ) : (
<<<<<<< Updated upstream
          teachers.map(teacher => (
            <div key={teacher._id} className="management-item">
              <div className="item-info">
                <h3>
                  {teacher.name}
                  {teacher.isHOD && <span className="badge">HOD</span>}
                </h3>
                <p className="item-email">{teacher.email}</p>
                <p className="item-meta">
                  Max hours: {teacher.maxHoursPerDay}/day, {teacher.maxHoursPerWeek}/week
                </p>
                {teacher.subjectsCanTeach && teacher.subjectsCanTeach.length > 0 && (
                  <div className="item-tags">
                    {teacher.subjectsCanTeach.map(subjectId => {
                      const subject = subjects.find(s => s._id === subjectId);
                      return subject ? (
                        <span key={subjectId} className="tag">{subject.name}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleEdit(teacher)}
                >
                  Edit
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDelete(teacher._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
=======
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
                      {teacher.name || "Unknown"}
                      <span className={`role-badge ${safeClassName(teacher.role, "unknown-role")}`}>
                        {teacher.role || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td>{teacher.email || "N/A"}</td>
                  <td>{teacher.department || "N/A"}</td>
                  <td>
                    <span className={`gender-badge ${safeClassName(teacher.gender, "unknown")}`}>
                      {teacher.gender || "Unknown"}
                    </span>
                  </td>
                  <td>{teacher.role || "N/A"}</td>
                  <td>{teacher.contact || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(teacher)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(teacher._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
>>>>>>> Stashed changes
        )}
      </div>
    </div>
  );
};

export default Teachers;
