import React from "react";
import "../Dashboard.css";

const StudentDashboard = ({ setActiveView, user }) => {
  return (
    <div className="dashboard student-dashboard">
      <h1>Student Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => setActiveView("my-timetable")}>
          <h3>📅 My Class Timetable</h3>
          <p>View your class schedule</p>
        </div>
        <div className="dashboard-card" onClick={() => setActiveView("timetable")}>
          <h3>🏢 Department Timetable</h3>
          <p>View full department timetable</p>
        </div>
        <div className="dashboard-card">
          <h3>📚 My Subjects</h3>
          <p>View enrolled subjects</p>
        </div>
        <div className="dashboard-card">
          <h3>👨‍🏫 My Teachers</h3>
          <p>View faculty information</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;