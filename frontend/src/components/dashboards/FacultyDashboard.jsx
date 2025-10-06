import React from "react";
import "./Dashboard.css";

const FacultyDashboard = ({ setActiveView, user }) => {
  return (
    <div className="dashboard faculty-dashboard">
      <h1>Faculty Dashboard - {user.name}</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => setActiveView("my-schedule")}>
          <h3>📅 My Schedule</h3>
          <p>View your teaching schedule</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("timetable")}>
          <h3>🏢 Department Timetable</h3>
          <p>View full department timetable</p>
        </div>
        <div className="dashboard-card">
          <h3>📋 My Subjects</h3>
          <p>View assigned subjects</p>
        </div>
        <div className="dashboard-card">
          <h3>⏰ Teaching Hours</h3>
          <p>View weekly teaching load</p>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;