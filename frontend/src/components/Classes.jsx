// src/components/Classes.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./Management.css";

const emptySubjectRow = () => ({
  subject: "",          // existing subject id (optional)
  newSubjectName: "",   // new subject name (optional)
  teacher: "",          // existing teacher id (optional)
  newTeacherName: "",   // new teacher name (optional)
  newTeacherEmail: "",  // new teacher email (optional)
  hoursPerWeek: 2
});

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    subjects: [emptySubjectRow()]
  });

  const [excelFile, setExcelFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchClasses(), fetchSubjects(), fetchTeachers()]);
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  // ---------- Excel upload ----------
  const handleFileChange = (e) => setExcelFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e && e.preventDefault();
    if (!excelFile) return alert("Please select a file first");

    const fd = new FormData();
    fd.append("file", excelFile);

    try {
      await api.post("/classes/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✅ Excel uploaded");
      setExcelFile(null);
      fetchAll();
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ---------- Form helpers ----------
  const addSubject = () => {
    setFormData(prev => ({ ...prev, subjects: [...prev.subjects, emptySubjectRow()] }));
  };

  const removeSubject = (idx) => {
    setFormData(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== idx) }));
  };

  const updateSubjectRow = (idx, key, value) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    }));
  };

  // When subject is selected, optionally clear newSubjectName
  const onSubjectSelect = (idx, value) => {
    updateSubjectRow(idx, "subject", value);
    if (value) updateSubjectRow(idx, "newSubjectName", "");
  };

  // When teacher is selected, optionally clear new teacher fields
  const onTeacherSelect = (idx, value) => {
    updateSubjectRow(idx, "teacher", value);
    if (value) {
      updateSubjectRow(idx, "newTeacherName", "");
      updateSubjectRow(idx, "newTeacherEmail", "");
    }
  };

  // get teachers filtered by subject id
  const teachersForSubject = (subjectId) => {
    if (!subjectId) return teachers;
    return teachers.filter(t => {
      // support populated subject objects or array of ids
      if (!t.subjectsCanTeach) return false;
      return t.subjectsCanTeach.some(s => {
        if (!s) return false;
        if (typeof s === "string") return s === subjectId;
        return s._id === subjectId || s._id.toString() === subjectId;
      });
    });
  };

  // ---------- Submit: create or update ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingClass) {
        // Update: send updated subjects array (subject may be id or subjectName)
        const payload = {
          name: formData.name,
          subjects: formData.subjects.map(r => {
            // prefer existing ids, else use provided names/emails
            const obj = {
              hoursPerWeek: Number(r.hoursPerWeek) || 2
            };
            if (r.subject && r.subject.length === 24) obj.subject = r.subject;
            else if (r.newSubjectName) obj.subjectName = r.newSubjectName;

            if (r.teacher && r.teacher.length === 24) obj.teacher = r.teacher;
            else if (r.newTeacherEmail) {
              obj.teacherEmail = r.newTeacherEmail;
              obj.teacherName = r.newTeacherName || r.newTeacherEmail.split('@')[0];
            }

            return obj;
          })
        };

        await api.put(`/classes/${editingClass._id}`, payload);
        alert("✅ Class updated");
      } else {
        // Create: call POST /classes with subjects array (backend will create as needed)
        const payload = {
          name: formData.name,
          subjects: formData.subjects.map(r => {
            const obj = { hoursPerWeek: Number(r.hoursPerWeek) || 2 };
            if (r.subject && r.subject.length === 24) obj.subject = r.subject;
            else if (r.newSubjectName) obj.subjectName = r.newSubjectName;

            if (r.teacher && r.teacher.length === 24) obj.teacher = r.teacher;
            else if (r.newTeacherEmail) {
              obj.teacherEmail = r.newTeacherEmail;
              obj.teacherName = r.newTeacherName || r.newTeacherEmail.split('@')[0];
            }

            return obj;
          })
        };

        await api.post("/classes", payload);
        alert("✅ Class created");
      }

      fetchAll();
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Edit / Delete ----------
  const handleEdit = (cls) => {
    setEditingClass(cls);
    setShowForm(true);

    setFormData({
      name: cls.name,
      subjects: (cls.subjects || []).map(s => ({
        subject: s.subject?._id || s.subject,
        newSubjectName: "",
        teacher: s.teacher?._id || s.teacher,
        newTeacherName: "",
        newTeacherEmail: "",
        hoursPerWeek: s.hoursPerWeek || 2
      }))
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (clsId) => {
    if (!window.confirm("Delete class?")) return;
    try {
      await api.delete(`/classes/${clsId}`);
      alert("✅ Deleted");
      fetchAll();
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Delete failed");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", subjects: [emptySubjectRow()] });
    setEditingClass(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading classes...</div>;

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>Manage Classes</h2>
        <div>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}>
            {showForm ? "Close" : "Add / Edit Class"}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Class Name *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <div className="form-group">
            <label>Subjects</label>
            {formData.subjects.map((row, idx) => (
              <div key={idx} className="subject-row">
                {/* Subject select */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select value={row.subject} onChange={e => onSubjectSelect(idx, e.target.value)}>
                    <option value="">-- Select existing subject --</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.type})</option>)}
                  </select>

                  <span style={{ margin: "0 6px" }}>OR</span>

                  <input
                    placeholder="New subject name (optional)"
                    value={row.newSubjectName}
                    onChange={e => updateSubjectRow(idx, "newSubjectName", e.target.value)}
                  />

                  {/* Teacher select (filtered by subject) */}
                  <select value={row.teacher} onChange={e => onTeacherSelect(idx, e.target.value)}>
                    <option value="">-- Select existing teacher --</option>
                    {teachersForSubject(row.subject).map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                    ))}
                  </select>

                  <span style={{ margin: "0 6px" }}>OR</span>

                  <input placeholder="New teacher name" value={row.newTeacherName} onChange={e => updateSubjectRow(idx, "newTeacherName", e.target.value)} />
                  <input placeholder="New teacher email" value={row.newTeacherEmail} onChange={e => updateSubjectRow(idx, "newTeacherEmail", e.target.value)} />

                  <input type="number" min="1" max="10" style={{ width: 90 }} value={row.hoursPerWeek} onChange={e => updateSubjectRow(idx, "hoursPerWeek", e.target.value)} />

                  <button type="button" className="btn-danger" onClick={() => removeSubject(idx)}>×</button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={addSubject}>+ Add Subject</button>
            </div>
          </div>

          {/* Excel upload */}
          <div className="form-group">
            <label>Upload via Excel</label>
            <input type="file" accept=".xlsx,.xls" onChange={e => setExcelFile(e.target.files[0])} />
            <button type="button" onClick={handleUpload} className="btn-primary">Upload Excel</button>
            <small className="muted">
              Excel columns (headers): className | subjectName | subjectType | hoursPerWeek | teacherName | teacherEmail | position
            </small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{editingClass ? "Update Class" : "Create Class"}</button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {/* Class list */}
      <div className="management-list">
        {classes.length === 0 ? (
          <div className="empty-state">
            <h3>No classes found</h3>
            <p>Add your first class to get started</p>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls._id} className="management-item">
              <div className="item-info">
                <h3>{cls.name}</h3>
                {cls.subjects && cls.subjects.length > 0 && (
                  <div className="subject-list">
                    <h4>Subjects</h4>
                    {cls.subjects.map((s, i) => (
                      <div key={i} className="subject-item">
                        <strong>{s.subject?.name || "Unknown"}</strong> ({s.subject?.type}) — {s.hoursPerWeek} hrs/week
                        <div>Teacher: {s.teacher?.name || "Unknown"} ({s.teacher?.email || "-"})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(cls)}>Edit</button>
                <button className="btn-danger" onClick={() => handleDelete(cls._id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Classes;
