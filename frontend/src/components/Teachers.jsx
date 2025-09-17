import React, { useState, useEffect } from "react";
import Select from "react-select";
import api from "../services/api";
import "./Management.css";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "Assistant Professor",
    subjectsCanTeach: [],
    maxPeriodsPerWeek: 18,
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers");
      setTeachers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      setSubjects(
        response.data.map((s) => ({ value: s._id, label: s.name }))
      );
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
        await api.post("/teachers", formData);
      }
      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error("❌ Error saving teacher:", error);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      position: teacher.position,
      subjectsCanTeach: teacher.subjectsCanTeach.map((s) => s._id),
      maxPeriodsPerWeek: teacher.maxPeriodsPerWeek,
    });
    setShowForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(`/teachers/${teacherId}`);
        fetchTeachers();
      } catch (error) {
        console.error("❌ Error deleting teacher:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      position: "Assistant Professor",
      subjectsCanTeach: [],
      maxPeriodsPerWeek: 20,
    });
    setEditingTeacher(null);
    setShowForm(false);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file");

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      await api.post("/teachers/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Teachers uploaded successfully");
      fetchTeachers();
    } catch (error) {
      console.error(error);
      alert("❌ Error uploading teachers");
    }
  };

  if (loading) return <div className="loading">Loading teachers...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Manage Teachers</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add New Teacher"}
        </button>
      </div>

      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
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
          <div className="form-group">
            <label>Position *</label>
            <select
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
            >
              <option value="HOD">HOD</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subjects They Can Teach</label>
            <Select
              isMulti
              options={subjects}
              value={subjects.filter((s) =>
                formData.subjectsCanTeach.includes(s.value)
              )}
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  subjectsCanTeach: selected.map((s) => s.value),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Max Periods Per Week</label>
            <input
              type="number"
              value={formData.maxPeriodsPerWeek}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxPeriodsPerWeek: parseInt(e.target.value),
                })
              }
              min="1"
              max="40"
            />
          </div>

          <div className="upload-section">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            <button
              type="button"
              className="btn-primary"
              onClick={handleFileUpload}
            >
              Upload Excel
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingTeacher ? "Update Teacher" : "Save Teacher"}
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
          teachers.map((teacher) => (
            <div key={teacher._id} className="management-item">
              <div className="item-info">
                <h3>
                  {teacher.name}{" "}
                  <span className="badge">{teacher.position}</span>
                </h3>
                <p className="item-email">{teacher.email}</p>
                <p className="item-meta">
                  Max periods/week: {teacher.maxPeriodsPerWeek}
                </p>
                {teacher.subjectsCanTeach &&
                  teacher.subjectsCanTeach.length > 0 && (
                    <div className="item-tags">
                      {teacher.subjectsCanTeach.map((subject) => (
                        <span key={subject._id} className="tag">
                          {subject.name}
                        </span>
                      ))}
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
        )}
      </div>
    </div>
  );
};

export default Teachers;
