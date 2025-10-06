import React from "react";
import "./Dashboard.css";

const HODDashboard = ({ setActiveView, user }) => {
  return (
    <div className="dashboard hod-dashboard">
      <h1>HOD Dashboard - {user.department}</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => setActiveView("teachers")}>
          <h3>👨‍🏫 Department Teachers</h3>
          <p>Manage teachers in your department</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("classes")}>
          <h3>🏫 Department Classes</h3>
          <p>Manage classes in your department</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("subjects")}>
          <h3>📚 Department Subjects</h3>
          <p>Manage subjects in your department</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("generate")}>
          <h3>⚡ Generate Timetable</h3>
          <p>Create timetable options for approval</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("manual")}>
          <h3>✏️ Manual Scheduling</h3>
          <p>Manual timetable adjustments</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("timetable")}>
          <h3>📊 View Timetable</h3>
          <p>Check current department timetable</p>
        </div>
      </div>
    </div>
  );
};

export default HODDashboard;