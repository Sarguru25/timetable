import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Management.css";
import api from "../services/api";
import * as XLSX from "xlsx";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    semester: "",
    studentCount: 30,
    subjects: [],
  });
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes"); // Use api instead of axios
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/subjects"); // Use api instead of axios
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers"); // Use api instead of axios
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token"); // get JWT stored at login
      const res = await axios.post(
        "http://localhost:5000/api/classes/bulk-upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // 🔑 add token here
          },
        }
      );

      console.log("Upload success:", res.data);
      alert("Bulk upload successful!");
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        // console.log("PUT payload:", formData);
        await api.put(`/classes/${editingClass._id}`, formData);
        // console.log("One subject example:", formData.subjects[0]);
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
      semester: classItem.semester,
      studentCount: classItem.studentCount,
      subjects: classItem.subjects.map((s) => ({
        subject: s.subject?._id || s.subject,
        teacher: s.teacher?._id || s.teacher,
        hoursPerWeek: s.hoursPerWeek,
      })),
    });

    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await api.delete(`/classes/${classId}`); // Use api instead of axios
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
      semester: "",
      studentCount: 30,
      subjects: [],
    });
    setEditingClass(null);
    setShowForm(false);
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

  // const getSubjectName = (subjectId) => {
  //   const subject = subjects.find((s) => s._id === subjectId);
  //   return subject ? subject.name : "Unknown Subject";
  // };

  // const getTeacherName = (teacherId) => {
  //   const teacher = teachers.find((t) => t._id === teacherId);
  //   return teacher ? teacher.name : "Unknown Teacher";
  // };
  const getSubjectName = (subjectObj) => {
    if (!subjectObj) return "Unknown Subject";
    return subjectObj.name || "Unknown Subject";
  };

  const getTeacherName = (teacherObj) => {
    if (!teacherObj) return "Unknown Teacher";
    return teacherObj.name || "Unknown Teacher";
  };

  if (loading) return <div className="loading">Loading classes...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Manage Classes</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add New Class"}
        </button>
      </div>

      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Class Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Class 10A"
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
              placeholder="e.g., Fall 2023"
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

          <div className="form-group">
            <label>Subjects</label>
            {formData.subjects.map((subject, index) => (
              <div key={index} className="subject-row">
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
                  placeholder="Hours"
                  required
                />

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeSubject(index)}
                  title="Remove subject"
                >
                  ×
                </button>
              </div>
            ))}

            <div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              <button onClick={handleUpload} className="btn-primary">
                Upload Excel
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={addSubject}
            >
              + Add Subject
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingClass ? "Update Class" : "Create Class"}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="management-list">
        {classes.length === 0 ? (
          <div className="empty-state">
            <h3>No classes found</h3>
            <p>Add your first class to get started with timetable scheduling</p>
          </div>
        ) : (
          classes.map((classItem) => (
            <div key={classItem._id} className="management-item">
              <div className="item-info">
                <h3>{classItem.name}</h3>
                <p className="item-meta">Semester: {classItem.semester}</p>
                <p className="item-meta">Students: {classItem.studentCount}</p>

                {classItem.subjects && classItem.subjects.length > 0 && (
                  <div className="subject-list">
                    <h4>Subjects:</h4>
                    {classItem.subjects.map((subject, index) => (
                      <div key={index} className="subject-item">
                        <span className="subject-name">
                          {getSubjectName(subject.subject)}
                        </span>
                        <span className="teacher-name">
                          - {getTeacherName(subject.teacher)}
                        </span>
                        <span className="hours">
                          ({subject.hoursPerWeek} hrs/week)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEdit(classItem)}
                  title="Edit class"
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(classItem._id)}
                  title="Delete class"
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

export default Classes;
