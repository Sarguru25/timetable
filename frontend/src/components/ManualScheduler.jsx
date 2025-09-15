import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManualScheduler.css";
import api from "../services/api";

const ManualScheduler = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    classId: "",
    teacherId: "",
    subjectId: "",
    day: 0,
    period: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [classesRes, teachersRes, subjectsRes] =
        await Promise.all([
          api.get("/classes"),
          api.get("/teachers"),
          api.get("/subjects"),
        ]);

      // Ensure they are arrays to avoid map errors
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({
        type: "error",
        text: "Failed to load data. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-select teacher if subject is selected and teacher teaches that subject
    if (field === "subjectId" && value) {
      const subject = subjects.find((s) => s._id === value);
      if (subject && teachers.length > 0) {
        const teacherForSubject = teachers.find((t) =>
          t.subjectsCanTeach?.includes(value)
        );
        if (teacherForSubject) {
          setFormData((prev) => ({
            ...prev,
            teacherId: teacherForSubject._id,
            subjectId: value,
          }));
        }
      }
    }
  };

  const validateForm = () => {
    if (
      !formData.classId ||
      !formData.teacherId ||
      !formData.subjectId ||
      formData.day === "" ||
      formData.period === ""
    ) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return false;
    }

    if (formData.period < 0 || formData.period > 7) {
      setMessage({ type: "error", text: "Period must be between 0 and 7" });
      return false;
    }

    if (formData.day < 0 || formData.day > 4) {
      setMessage({
        type: "error",
        text: "Day must be between 0 (Monday) and 4 (Friday)",
      });
      return false;
    }

    return true;
  };

  const checkAvailability = async () => {
    try {
      const response = await api.post("/check-availability", {
        teacherId: formData.teacherId,
        day: formData.day,
        period: formData.period,
      });

      return response.data.available;
    } catch (error) {
      console.error("Availability check failed:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!validateForm()) return;

    const isAvailable = await checkAvailability();
    if (!isAvailable) {
      setMessage({
        type: "warning",
        text: "Teacher or room is not available at this time. Do you want to proceed anyway?",
      });
      return;
    }

    await scheduleSlot();
  };

  const scheduleSlot = async () => {
    try {
      setSaving(true);
      const response = await api.post("/manual", {
        ...formData,
        locked: true,
      });

      setMessage({
        type: "success",
        text: `Successfully scheduled ${getSubjectName(
          formData.subjectId
        )} for ${getClassName(formData.classId)}`,
      });

      // Reset form but keep class selection
      setFormData((prev) => ({
        ...prev,
        teacherId: "",
        subjectId: "",
        day: 0,
        period: 0,
      }));

      console.log("Scheduling successful:", response.data);
    } catch (error) {
      console.error("Scheduling failed:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to schedule. Please try again.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const getTeacherSubjects = (teacherId) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    return teacher?.subjectsCanTeach || [];
  };

  const getClassName = (classId) => {
    const classItem = classes.find((c) => c._id === classId);
    return classItem
      ? `${classItem.name} - ${classItem.semester}`
      : "Unknown Class";
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    return teacher?.name || "Unknown Teacher";
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject?.name || "Unknown Subject";
  };


  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 8 }, (_, i) => i);

  if (loading) {
    return (
      <div className="manual-scheduler-container">
        <div className="loading-spinner">Loading scheduling data...</div>
      </div>
    );
  }

  return (
    <div className="manual-scheduler-container">
      <div className="scheduler-header">
        <h2>Manual Class Scheduling</h2>
        <p>Manually assign subjects to specific time slots</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          {message.type === "warning" && (
            <div className="warning-actions">
              <button onClick={scheduleSlot} className="btn-primary btn-sm">
                Yes, Schedule Anyway
              </button>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="scheduler-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Select Class *</label>
            <select
              value={formData.classId}
              onChange={(e) => handleInputChange("classId", e.target.value)}
              required
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - {cls.semester} ({cls.studentCount} students)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Teacher *</label>
            <select
              value={formData.teacherId}
              onChange={(e) => handleInputChange("teacherId", e.target.value)}
              required
            >
              <option value="">Choose a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} {teacher.isHOD && "(HOD)"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Subject *</label>
            <select
              value={formData.subjectId}
              onChange={(e) => handleInputChange("subjectId", e.target.value)}
              required
            >
              <option value="">Choose a subject</option>
              {formData.teacherId
                ? getTeacherSubjects(formData.teacherId).map((subjectId) => {
                    const subject = subjects.find((s) => s._id === subjectId);
                    return subject ? (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.type})
                      </option>
                    ) : null;
                  })
                : subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.type})
                    </option>
                  ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Day *</label>
            <select
              value={formData.day}
              onChange={(e) =>
                handleInputChange("day", parseInt(e.target.value))
              }
              required
            >
              <option value="">Choose a day</option>
              {days.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Period *</label>
            <select
              value={formData.period}
              onChange={(e) =>
                handleInputChange("period", parseInt(e.target.value))
              }
              required
            >
              <option value="">Choose a period</option>
              {periods.map((period) => (
                <option key={period} value={period}>
                  Period {period + 1} (
                  {period === 0 ? "8:00" : `${8 + period}:00`})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary btn-large"
          >
            {saving ? "Scheduling..." : "Schedule Class"}
          </button>
        </div>
      </form>

      {formData.classId && formData.teacherId && formData.subjectId && (
        <div className="scheduling-preview">
          <h3>Scheduling Preview</h3>
          <div className="preview-card">
            <p>
              <strong>Class:</strong> {getClassName(formData.classId)}
            </p>
            <p>
              <strong>Teacher:</strong> {getTeacherName(formData.teacherId)}
            </p>
            <p>
              <strong>Subject:</strong> {getSubjectName(formData.subjectId)}
            </p>
            <p>
              <strong>Time:</strong> {days[formData.day]} - Period{" "}
              {formData.period + 1}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualScheduler;
