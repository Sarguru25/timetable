import React from "react";
import "./Dashboard.css";

const AdminDashboard = ({ setActiveView, user }) => {
  return (
    <div className="dashboard admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-grid"  >
        <div className="dashboard-card" onClick={() => setActiveView("user-management")}>
          <h3>👥 User Management</h3>
          <p>Create and manage all users</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("department")}>
          <h3>🏢 Department Management</h3>
          <p>Manage departments and HOD assignments</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("timetable")}>
          <h3>📅 Timetable Overview</h3>
          <p>View and approve all timetables</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("teachers")}>
          <h3>👨‍🏫 Teacher Management</h3>
          <p>Manage all teachers across departments</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("classes")}>
          <h3>🏫 Class Management</h3>
          <p>Manage all classes and sections</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("subjects")}>
          <h3>📚 Subject Management</h3>
          <p>Manage all subjects and curriculum</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;