import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Classes.css";
import api from "../../services/api";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    year: 1,
    section: "A",
    semester: "",
    studentCount: 30,
    subjects: [],
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes");
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Group classes by name, then year, then section
  const groupedClasses = classes.reduce((acc, classItem) => {
    const { name, year, section } = classItem;
    
    if (!acc[name]) {
      acc[name] = {};
    }
    if (!acc[name][year]) {
      acc[name][year] = {};
    }
    if (!acc[name][year][section]) {
      acc[name][year][section] = [];
    }
    
    acc[name][year][section].push(classItem);
    return acc;
  }, {});

  const toggleYear = (className, year) => {
    setExpandedYears(prev => ({
      ...prev,
      [`${className}-${year}`]: !prev[`${className}-${year}`]
    }));
  };

  const toggleSection = (className, year, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${className}-${year}-${section}`]: !prev[`${className}-${year}-${section}`]
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/classes/bulk-upload",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Classes uploaded successfully!");
      fetchClasses();
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, formData);
      } else {
        await api.post("/classes", formData);
      }
      resetForm();
      fetchClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      alert(
        "Error saving class: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      year: classItem.year,
      section: classItem.section,
      semester: classItem.semester,
      studentCount: classItem.studentCount,
      subjects: classItem.subjects.map((s) => ({
        subject: s.subject?._id || s.subject,
        teacher: s.teacher?._id || s.teacher,
        hoursPerWeek: s.hoursPerWeek,
      })),
    });
    setShowModal(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await api.delete(`/classes/${classId}`);
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        alert(
          "Error deleting class: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      year: 1,
      section: "A",
      semester: "",
      studentCount: 30,
      subjects: [],
    });
    setEditingClass(null);
    setShowModal(false);
  };

  const addSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { subject: "", teacher: "", hoursPerWeek: 2 },
      ],
    }));
  };

  const removeSubject = (index) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const updateSubject = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      ),
    }));
  };

  if (loading) {
    return (
      <div className="classes-container">
        <div className="loading-spinner">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="classes-container">
      {/* Header */}
      <div className="classes-header">
        <div className="header-content">
          <h1>Class Management</h1>
          <p>Create and manage classes with year and section grouping</p>
        </div>
        <div className="header-actions">
          <div className="file-upload">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="file-label">
              📁 Upload Excel
            </label>
            {file && (
              <button onClick={handleUpload} className="upload-btn">
                Upload
              </button>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add New Class
          </button>
        </div>
      </div>

      {/* Classes Accordion */}
      <div className="classes-accordion">
        {Object.keys(groupedClasses).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No Classes Found</h3>
            <p>Add your first class to get started</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Create Class
            </button>
          </div>
        ) : (
          Object.entries(groupedClasses).map(([className, years]) => (
            <div key={className} className="class-group">
              <div className="class-name-header">
                <h2>{className}</h2>
              </div>
              
              {Object.entries(years).map(([year, sections]) => (
                <div key={`${className}-${year}`} className="year-group">
                  <div 
                    className="year-header accordion-header"
                    onClick={() => toggleYear(className, year)}
                  >
                    <h3>Year {year}</h3>
                    <span className="accordion-icon">
                      {expandedYears[`${className}-${year}`] ? '−' : '+'}
                    </span>
                  </div>
                  
                  {expandedYears[`${className}-${year}`] && (
                    <div className="year-content">
                      {Object.entries(sections).map(([section, classList]) => (
                        <div key={`${className}-${year}-${section}`} className="section-group">
                          <div 
                            className="section-header accordion-header"
                            onClick={() => toggleSection(className, year, section)}
                          >
                            <h4>Section {section}</h4>
                            <span className="accordion-icon">
                              {expandedSections[`${className}-${year}-${section}`] ? '−' : '+'}
                            </span>
                          </div>
                          
                          {expandedSections[`${className}-${year}-${section}`] && (
                            <div className="section-content">
                              {classList.map((cls) => (
                                <div key={cls._id} className="class-card">
                                  <div className="class-card-header">
                                    <div className="class-info">
                                      <h5>{cls.semester}</h5>
                                      <div className="class-meta">
                                        <span className="student-count">
                                          👥 {cls.studentCount || 0} Students
                                        </span>
                                      </div>
                                    </div>
                                    <div className="class-actions">
                                      <button
                                        className="btn btn-edit"
                                        onClick={() => handleEdit(cls)}
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        className="btn btn-delete"
                                        onClick={() => handleDelete(cls._id)}
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subjects */}
                                  {cls.subjects && cls.subjects.length > 0 ? (
                                    <div className="subject-list">
                                      <h6>Subjects</h6>
                                      {cls.subjects.map((s, i) => (
                                        <div key={i} className="subject-item">
                                          <div className="subject-main">
                                            <span className="subject-name">
                                              {s.subject?.name || "Unknown Subject"}
                                            </span>
                                            <span className="hours-badge">
                                              {s.hoursPerWeek} hrs/week
                                            </span>
                                          </div>
                                          <div className="teacher-info">
                                            Teacher: {s.teacher?.name || "Unknown Teacher"}
                                            {s.teacher?.email && (
                                              <span className="teacher-email">
                                                ({s.teacher.email})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-subjects">No subjects assigned</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>{editingClass ? "Edit Class" : "Create New Class"}</h2>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>

            <form className="class-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Class Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., BCA, BCOM, BSc"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Year *</label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: parseInt(e.target.value) })
                      }
                      required
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Section *</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., A, B, C"
                      maxLength="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Semester *</label>
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      placeholder="e.g., Semester 1, Semester 2"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Student Count</label>
                    <input
                      type="number"
                      value={formData.studentCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          studentCount: parseInt(e.target.value) || 30,
                        })
                      }
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Subjects</h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addSubject}
                  >
                    + Add Subject
                  </button>
                </div>

                {formData.subjects.map((subject, index) => (
                  <div key={index} className="subject-card">
                    <div className="card-header">
                      <span>Subject #{index + 1}</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeSubject(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="subject-fields">
                      <div className="form-group">
                        <label>Subject *</label>
                        <select
                          value={subject.subject}
                          onChange={(e) =>
                            updateSubject(index, "subject", e.target.value)
                          }
                          required
                        >
                          <option value="">Select Subject</option>
                          {subjects.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} ({s.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Teacher *</label>
                        <select
                          value={subject.teacher}
                          onChange={(e) =>
                            updateSubject(index, "teacher", e.target.value)
                          }
                          required
                        >
                          <option value="">Select Teacher</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group hours-field">
                        <label>Hours per Week *</label>
                        <input
                          type="number"
                          value={subject.hoursPerWeek}
                          onChange={(e) =>
                            updateSubject(
                              index,
                              "hoursPerWeek",
                              parseInt(e.target.value) || 2
                            )
                          }
                          min="1"
                          max="10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.subjects.length === 0 && (
                  <div className="no-subjects-message">
                    No subjects added. Click "Add Subject" to get started.
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingClass ? "Update Class" : "Create Class"}
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
    </div>
  );
};

export default Classes;