import React, { useState } from "react";
import PropTypes from "prop-types";
import "./Navigation.css";

const Navigation = ({ activeView, setActiveView, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar open/close
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Handle navigation link click
  const handleNavClick = (view) => {
    setActiveView(view);
    closeSidebar();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="layout">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="top-nav-left">
          {/* Hamburger button (mobile view) */}
          <button className="hamburger" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="logo">Timetable System</h1>
        </div>

        <div className="top-nav-right">
          <button
            className="top-nav"
            // style={{
              // backgroundColor: "#1f2937",
            //   color: "white",
            //   border: "none",
            //   cursor: "pointer",
            //   padding: "8px 12px",
            //   borderRadius: "4px",
            //   marginRight: "10px",
            // }}
            onClick={() => handleNavClick("dashboard")}
          >
            Home
          </button>
          <button
            // style={{
            //   backgroundColor: "#1f2937",
            //   color: "white",
            //   border: "none",
            //   cursor: "pointer",
            //   padding: "8px 12px",
            //   borderRadius: "4px",
            //   marginRight: "10px",
            // }}
            className="top-nav"
            onClick={() => handleNavClick("departments")}
          >
            Departments
          </button>
          <button
            // style={{
            //   backgroundColor: "#1f2937",
            //   color: "white",
            //   border: "none",
            //   cursor: "pointer",
            //   padding: "8px 12px",
            //   borderRadius: "4px",
            //   marginRight: "10px",
            // }}
            className="top-nav"
            onClick={() => handleNavClick("timetable")}
          >
            View Timetable
          </button>
          <span className="user-info">
            {user?.name} ({user?.role})
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside id="sidebar" className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Close Button */}
        <button className="close-btn" onClick={closeSidebar}>
          ✕
        </button>

        <nav className="sidebar-menu">
          <button
            className={`nav-link ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            Home
          </button>

          <button
            className={`nav-link ${activeView === "teachers" ? "active" : ""}`}
            onClick={() => handleNavClick("teachers")}
          >
            Manage Teachers
          </button>

          <button
            className={`nav-link ${activeView === "classes" ? "active" : ""}`}
            onClick={() => handleNavClick("classes")}
          >
            Manage Classes
          </button>

          <button
            className={`nav-link ${activeView === "subjects" ? "active" : ""}`}
            onClick={() => handleNavClick("subjects")}
          >
            Manage Subjects
          </button>

          <button
            className={`nav-link ${
              activeView === "departments" ? "active" : ""
            }`}
            onClick={() => handleNavClick("departments")}
          >
            Departments
          </button>

          <button
            className={`nav-link ${activeView === "timetable" ? "active" : ""}`}
            onClick={() => handleNavClick("timetable")}
            // disabled={!selectedClass && !selectedTeacher}
          >
            View Timetable
          </button>

          {user?.role === "teacher" && (
            <button
              className={`nav-link ${activeView === "manual" ? "active" : ""}`}
              onClick={() => handleNavClick("manual")}
            >
              Manual Scheduling
            </button>
          )}

          {user?.role === "admin" && (
            <button
              className={`nav-link ${
                activeView === "generate" ? "active" : ""
              }`}
              onClick={() => handleNavClick("generate")}
            >
              Generate Schedule
            </button>
          )}
        </nav>
        <div className="nav-footer">
          <button className="new-member-btn" onClick={handleLogout}>
            {" "}
            Add new member{" "}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay (when sidebar is open on mobile) */}
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* Main Content Area */}
      {/* <main className="main-content"> */}
        {/* Content for each view will be rendered here */}
      {/* </main> */}
      
    </div>
  );
};

Navigation.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
  selectedClass: PropTypes.any,
  selectedTeacher: PropTypes.any,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
  }),
};

export default Navigation;
