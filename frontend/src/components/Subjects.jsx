import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./Management.css";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "theory",
    hoursPerWeek: 2,
    classId: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
  }, []);

  // 🔹 Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      setSubjects(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      setLoading(false);
    }
  };

  // 🔹 Fetch classes
  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching classes:", err);
    }
  };

  // 🔹 Handle Excel file input
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // 🔹 Upload subjects via Excel
  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file");
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      await api.post("/subjects/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Subjects uploaded successfully");
      fetchSubjects();
    } catch (error) {
      console.error("❌ Error uploading subjects:", error);
      alert("❌ Error uploading subjects: " + (error.response?.data?.message || ""));
    }
  };

  // 🔹 Add / Update subject manually
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        alert("✅ Subject updated successfully");
      } else {
        await api.post("/subjects", formData);
        alert("✅ Subject added successfully");
      }
      resetForm();
      fetchSubjects();
    } catch (error) {
      console.error("❌ Error saving subject:", error);
      alert("❌ Error saving subject: " + (error.response?.data?.message || ""));
    }
  };

  // 🔹 Edit subject
  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      type: subject.type,
      hoursPerWeek: subject.hoursPerWeek,
      classId: subject.classId?._id || "",
    });
    setShowForm(true);
  };

  // 🔹 Delete subject
  const handleDelete = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/subjects/${subjectId}`);
        alert("✅ Subject deleted successfully");
        fetchSubjects();
      } catch (error) {
        console.error("❌ Error deleting subject:", error);
        alert("❌ Error deleting subject: " + (error.response?.data?.message || ""));
      }
    }
  };

  // 🔹 Reset form
  const resetForm = () => {
    setFormData({ name: "", type: "theory", hoursPerWeek: 2, classId: "" });
    setEditingSubject(null);
    setShowForm(false);
    setFile(null);
  };

  if (loading) return <div className="loading">Loading subjects...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>📚 Manage Subjects</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "➕ Add New Subject"}
        </button>
      </div>

      {/* 🔹 Form for Manual Add / Edit + Excel Upload */}
      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Subject Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hours Per Week</label>
            <input
              type="number"
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>

          <div className="form-group">
            <label>Class *</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              required
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} (Semester {cls.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Excel Upload Option */}
          <div className="excel-upload">
            <label>Upload via Excel</label>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <button type="button" className="btn-primary" onClick={handleFileUpload}>
              Upload Excel
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingSubject ? "Update Subject" : "Save Subject"}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 🔹 List of Subjects */}
      <div className="management-list">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <h3>No subjects found</h3>
            <p>Add your first subject to get started</p>
          </div>
        ) : (
          subjects.map((subject) => (
            <div key={subject._id} className="management-item">
              <div className="item-info">
                <h3>{subject.name}</h3>
                <div className="item-details">
                  <span className={`badge ${subject.type}`}>{subject.type}</span>
                  <span className="item-meta">{subject.hoursPerWeek} hrs/week</span>
                  <span className="item-meta">
                    Class: {subject.classId?.name || "N/A"}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(subject)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(subject._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Subjects;
