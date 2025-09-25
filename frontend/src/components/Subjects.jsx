import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./Subjects.css";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    class: "all",
    teacher: "all",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [formData, setFormData] = useState({
    name: "",
    sCode: "",
    type: "theory",
    hoursPerWeek: 2,
    classId: "",
    teacherCode: "",
  });

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      setSubjects(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching subjects:", error);
      setLoading(false);
      showNotification("Error fetching subjects", "error");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching classes:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching teachers:", err);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
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
      await api.post("/subjects/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification("Subjects uploaded successfully");
      fetchSubjects();
      setFile(null);
      document.querySelector(".file-input").value = "";
    } catch (error) {
      console.error("❌ Error uploading subjects:", error);
      showNotification("Error uploading subjects", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        showNotification("Subject updated successfully");
      } else {
        await api.post("/subjects", formData);
        showNotification("Subject added successfully");
      }
      resetForm();
      fetchSubjects();
    } catch (error) {
      console.error("❌ Error saving subject:", error);
      showNotification("Error saving subject", "error");
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      sCode: subject.sCode,
      type: subject.type,
      hoursPerWeek: subject.hoursPerWeek,
      classId: subject.classId?._id || "",
      teacherCode: subject.teacherId?.tCode || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await api.delete(`/subjects/${subjectId}`);
        showNotification("Subject deleted successfully");
        fetchSubjects();
      } catch (error) {
        console.error("❌ Error deleting subject:", error);
        showNotification("Error deleting subject", "error");
      }
    }
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setFormData({
      name: "",
      sCode: "",
      type: "theory",
      hoursPerWeek: 2,
      classId: "",
      teacherCode: "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFile(null);
  };

  // Search and filter functionality
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter and sort subjects
const getFilteredAndSortedSubjects = () => {
  let filtered = subjects.filter(subject => {
    const matchesSearch =
      (subject?.name || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (subject?.sCode || "").toLowerCase().includes((searchTerm || "").toLowerCase());

    const matchesType = filters.type === "all" || subject?.type === filters.type;
    const matchesClass = filters.class === "all" || subject?.classId?._id === filters.class;
    const matchesTeacher = filters.teacher === "all" || subject?.teacherId?._id === filters.teacher;

    return matchesSearch && matchesType && matchesClass && matchesTeacher;
  });

  // Sort subjects
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested objects
      if (sortConfig.key === "classId") {
        aValue = a.classId?.name || "";
        bValue = b.classId?.name || "";
      } else if (sortConfig.key === "teacherId") {
        aValue = a.teacherId?.name || "";
        bValue = b.teacherId?.name || "";
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  return filtered;
};
  const filteredSubjects = getFilteredAndSortedSubjects();

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "";
    // if (sortConfig.key !== key) return "↕️";
    // if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  if (loading) {
    return <div className="loading">Loading subjects...</div>;
  }

  return (
    <div className="subjects-container">
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="subjects-header">
        <h2>📚 Subject Management</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <span className="btn-icon">+</span> Add New Subject
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

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>

          <select
            value={filters.class}
            onChange={(e) => handleFilterChange("class", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} (Sem {cls.semester})
              </option>
            ))}
          </select>

          <select
            value={filters.teacher}
            onChange={(e) => handleFilterChange("teacher", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div className="results-info">
          Showing {filteredSubjects.length} of {subjects.length} subjects
        </div>
      </div>

      {/* Subjects Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSubject ? "Edit Subject" : "Add New Subject"}</h3>
              <button className="close-btn" onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="subject-form">
              <div className="form-grid">
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
                  <label>Subject Code *</label>
                  <input
                    type="text"
                    value={formData.sCode}
                    onChange={(e) =>
                      setFormData({ ...formData, sCode: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
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
                  <label>Class *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} (Sem {cls.semester})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Teacher *</label>
                  <select
                    value={formData.teacherCode}
                    onChange={(e) =>
                      setFormData({ ...formData, teacherCode: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t.tCode}>
                        {t.name} ({t.tCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? "Update Subject" : "Save Subject"}
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

      {/* Subjects Data Grid */}
      <div className="data-grid-container">
        {filteredSubjects.length === 0 ? (
          <div className="empty-state">
            <h3>No subjects found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="data-grid">
            <thead>
              <tr>
                <th onClick={() => handleSort("sCode")} className="sortable">
                  Code {getSortIcon("sCode")}
                </th>
                <th onClick={() => handleSort("name")} className="sortable">
                  Subject Name {getSortIcon("name")}
                </th>
                <th onClick={() => handleSort("type")} className="sortable">
                  Type {getSortIcon("type")}
                </th>
                <th
                  onClick={() => handleSort("hoursPerWeek")}
                  className="sortable"
                >
                  Hours/Week {getSortIcon("hoursPerWeek")}
                </th>
                <th onClick={() => handleSort("classId")} className="sortable">
                  Class {getSortIcon("classId")}
                </th>
                <th
                  onClick={() => handleSort("teacherId")}
                  className="sortable"
                >
                  Teacher {getSortIcon("teacherId")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject._id}>
                  <td>
                    <span className="subject-code">{subject.sCode}</span>
                  </td>
                  <td>
                    <div className="subject-name">{subject.name}</div>
                  </td>
                  <td>
                    <span className={`type-badge ${subject.type}`}>
                      {subject.type}
                    </span>
                  </td>
                  <td>
                    <span className="hours-badge">
                      {subject.hoursPerWeek} hrs
                    </span>
                  </td>
                  <td>
                    {subject.classId ? (
                      <span className="class-info">
                        {subject.classId.name} (Sem {subject.classId.semester})
                      </span>
                    ) : (
                      <span className="no-data">N/A</span>
                    )}
                  </td>
                  <td>
                    {subject.teacherId ? (
                      <span className="teacher-info">
                        {subject.teacherId.name}
                        <span className="teacher-code">
                          ({subject.teacherId.tCode})
                        </span>
                      </span>
                    ) : (
                      <span className="no-data">N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(subject)}
                        title="Edit subject"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(subject._id)}
                        title="Delete subject"
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

      {/* Pagination would go here if needed */}
    </div>
  );
};

export default Subjects;
