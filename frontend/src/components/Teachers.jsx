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
      console.error('Error deleting teacher:', error);
    }
  }
};

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
      </div>

      {showForm && (
        <form className="management-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
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
        )}
      </div>
    </div>
  );
};

export default Teachers;