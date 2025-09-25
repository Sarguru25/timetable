
import React, { useState, useEffect } from "react";
import "./ManageTeachers.css"; // Import the separate CSS file

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null); // null for add, object for edit
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    department: "",
  });

  // Fetch teachers from API
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/teachers"); // Adjust URL if needed (e.g., 'http://localhost:5000/api/teachers')
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      const data = await response.json();
      setTeachers(data);
      setFilteredTeachers(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Search/Filter
  useEffect(() => {
    const filtered = teachers.filter(
      (teacher) =>
        teacher.id
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [searchTerm, teachers]);

  // Open modal for add or edit
  const openModal = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      });
    } else {
      setEditingTeacher(null);
      setFormData({ id: "", name: "", email: "", department: "" });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    setFormData({ id: "", name: "", email: "", department: "" });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.id.trim()) return "Teacher ID is required.";
    if (!formData.name.trim()) return "Name is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email format.";
    if (!formData.department.trim()) return "Department is required.";
    return null;
  };

  // Save/Add/Update teacher
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError); // Replace with toast in production
      return;
    }

    try {
      let response;
      if (editingTeacher) {
        // Update
        response = await fetch(`/api/teachers/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Add
        response = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        throw new Error(
          editingTeacher ? "Failed to update teacher" : "Failed to add teacher"
        );
      }

      alert(
        editingTeacher
          ? "Teacher updated successfully!"
          : "Teacher added successfully!"
      ); // Replace with toast
      closeModal();
      fetchTeachers(); // Refresh list
    } catch (err) {
      alert(err.message);
      console.error("Error saving teacher:", err);
    }
  };

  // Delete teacher
  const handleDelete = async (id) => {
    if (
      !window.confirm(`Are you sure you want to delete teacher with ID ${id}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete teacher");
      }
      alert("Teacher deleted successfully!"); // Replace with toast
      fetchTeachers(); // Refresh list
    } catch (err) {
      alert(err.message);
      console.error("Error deleting teacher:", err);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading teachers...</div>;
  }

  return (
    <div className="manage-teachers-container">
      {/* Header with Add Button and Search */}
      <div className="header-section">
        <h2>Manage Teachers</h2>
        <button className="add-btn" onClick={() => openModal()}>
          Add Teacher
        </button>
        <input
          type="text"
          placeholder="Search by ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Teachers Table */}
      <div className="table-container">
        <table className="teachers-table">
          <thead>
            <tr>
              <th>Teacher ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No teachers found. Add one to get started!
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.id}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.department}</td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => openModal(teacher)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(teacher.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h3>
            <div className="form-group">
              <label>Teacher ID * (Unique)</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                placeholder="Enter Teacher ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter Name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter Email"
                required
              />
            </div>
            <div className="form-group">
              <label>Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Enter Department (e.g., B.Com Accounting)"
                required
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;
