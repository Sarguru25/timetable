import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Management.css";
import api from "../services/api";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "theory",
    hoursPerWeek: 2,
    mandatory: true,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

const fetchSubjects = async () => {
  try {
    const response = await api.get("/subjects");
    console.log("📡 Subjects API response:", response.data);

    // If backend returns { subjects: [...] }
    if (Array.isArray(response.data)) {
      setSubjects(response.data);
    } else if (Array.isArray(response.data.subjects)) {
      setSubjects(response.data.subjects);
    } else {
      setSubjects([]); 
    }

    setLoading(false);  
  } catch (error) {
    console.error("❌ Error fetching subjects:", error);
    setLoading(false);   
  }
};


 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingSubject) {
      await api.put(`/subjects/${editingSubject._id}`, formData);
    } else {
      await api.post("/subjects", formData);
    }
    resetForm();
    fetchSubjects();
  } catch (error) {
    console.error("Error saving subject:", error);
  }
};
  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      type: subject.type,
      hoursPerWeek: subject.hoursPerWeek,
      mandatory: subject.mandatory,
    });
    setShowForm(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/subjects/${subjectId}`);
        fetchSubjects();
      } catch (error) {
        console.error("Error deleting subject:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "theory",
      hoursPerWeek: 2,
      mandatory: true,
    });
    setEditingSubject(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading subjects...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Manage Subjects</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add New Subject"}
        </button>
      </div>

      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name *</label>
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
            <label>Subject Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hoursPerWeek: parseInt(e.target.value),
                })
              }
              min="1"
              max="10"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.mandatory}
                onChange={(e) =>
                  setFormData({ ...formData, mandatory: e.target.checked })
                }
              />
              Mandatory Subject
            </label>
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
                  <span className={`badge ${subject.type}`}>
                    {subject.type}
                  </span>
                  <span className="item-meta">
                    {subject.hoursPerWeek} hours/week
                  </span>
                  {subject.mandatory && (
                    <span className="badge mandatory">Mandatory</span>
                  )}
                </div>
              </div>
              <div className="item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEdit(subject)}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(subject._id)}
                >
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
