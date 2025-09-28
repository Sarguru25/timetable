<<<<<<< Updated upstream
import React from "react";

const Navigation = ({
  activeView,
  setActiveView,
  selectedClass,
  setSelectedClass,
  selectedTeacher,
  setSelectedTeacher,
  user,
}) => {
  const classes = [
    { id: "1", name: "Class 10A" },
    { id: "2", name: "Class 10B" },
    { id: "3", name: "Class 11A" },
    { id: "4", name: "Class 11B" },
  ];

  const teachers = [
    { id: "1", name: "Dr. Smith" },
    { id: "2", name: "Prof. Johnson" },
    { id: "3", name: "Ms. Williams" },
    { id: "4", name: "Mr. Brown" },
  ];

=======
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import PropTypes from "prop-types";
import "./Navigation.css";

const Navigation = ({ activeView, setActiveView, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, isHOD, isFaculty, isStudent, logout } =
    useContext(AuthContext);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleNavClick = (view) => {
    setActiveView(view);
    closeSidebar();
  };

>>>>>>> Stashed changes
  const handleLogout = () => {
    logout();
  };

  // Role-based navigation items
  const getNavItems = () => {
    const commonItems = [
      { view: "dashboard", label: "Dashboard", icon: "🏠" },
      { view: "timetable", label: "View Timetable", icon: "📅" },
    ];

    if (isAdmin()) {
      return [
        ...commonItems,
        { view: "user-management", label: "User Management", icon: "👥" },
        { view: "teachers", label: "Manage Teachers", icon: "👨‍🏫" },
        { view: "classes", label: "Manage Classes", icon: "🏫" },
        { view: "subjects", label: "Manage Subjects", icon: "📚" },
        { view: "department", label: "Departments", icon: "🏢" },
        { view: "generate", label: "Generate Schedule", icon: "⚡" },
      ];
    }

    if (isHOD()) {
      return [
        ...commonItems,
        { view: "teachers", label: "Department Teachers", icon: "👨‍🏫" },
        { view: "classes", label: "Department Classes", icon: "🏫" },
        { view: "subjects", label: "Department Subjects", icon: "📚" },
        { view: "department", label: "Department", icon: "🏢" },
        { view: "manual", label: "Manual Scheduling", icon: "✏️" },
        { view: "generate", label: "Generate Timetable", icon: "⚡" },
      ];
    }

    if (isFaculty()) {
      return [
        ...commonItems,
        { view: "my-schedule", label: "My Schedule", icon: "⏰" },
      ];
    }

    if (isStudent()) {
      return [
        ...commonItems,
        { view: "my-timetable", label: "My Timetable", icon: "📚" },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
<<<<<<< Updated upstream
    <nav className="navigation">
      <div className="nav-header">
        <h1>Timetable System</h1>
        <div className="user-info">
          Logged in as: {user?.name} ({user?.role})
=======
    <div className="layout">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="top-nav-left">
          <button className="hamburger" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="logo">Timetable System</h1>
>>>>>>> Stashed changes
        </div>
      </div>

<<<<<<< Updated upstream
      <ul className="nav-menu">
        {/* Add these to your navigation menu */}
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "teachers" ? "active" : ""}`}
            onClick={() => setActiveView("teachers")}
          >
            Manage Teachers
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "classes" ? "active" : ""}`}
            onClick={() => setActiveView("classes")}
          >
            Manage Classes
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "subjects" ? "active" : ""}`}
            onClick={() => setActiveView("subjects")}
          >
            Manage Subjects
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            Dashboard
          </button>
        </li>
        <li className="nav-item">
          <div className="form-group">
            <label>Select Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">View All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </li>
        <li className="nav-item">
          <div className="form-group">
            <label>Select Teacher:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">View All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeView === "timetable" ? "active" : ""}`}
            onClick={() => setActiveView("timetable")}
            disabled={!selectedClass && !selectedTeacher}
          >
            View Timetable
          </button>
        </li>
        {user?.role === "teacher" && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeView === "manual" ? "active" : ""}`}
              onClick={() => setActiveView("manual")}
=======
        <div className="top-nav-right">
          <span className="user-info">
            {user?.name} ({user?.role}
            {user?.department && ` - ${user.department}`})
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside id="sidebar" className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={closeSidebar}>
          ✕
        </button>

        <nav className="sidebar-menu">
          {navItems.map((item) => (
            <button
              key={item.view}
              className={`nav-link ${activeView === item.view ? "active" : ""}`}
              onClick={() => handleNavClick(item.view)}
>>>>>>> Stashed changes
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
<<<<<<< Updated upstream
          </li>
        )}
        {user?.role === "admin" && (
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeView === "generate" ? "active" : ""
              }`}
              onClick={() => setActiveView("generate")}
            >
              Generate Schedule
            </button>
          </li>
        )}
      </ul>

      <div className="nav-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

=======
          ))}
        </nav>

        <div className="nav-footer">
          {isAdmin() && (
            <button
              className="new-member-btn"
              onClick={() => handleNavClick("user-management")}
            >
              👥 Add New User
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}
    </div>
  );
};

Navigation.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
    department: PropTypes.string,
  }),
};

>>>>>>> Stashed changes
export default Navigation;
