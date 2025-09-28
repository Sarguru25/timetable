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

  const handleLogout = () => {
    logout();
  };

  // Role-based navigation items
  const getNavItems = () => {
    const commonItems = [
      { view: "dashboard", label: "Dashboard", icon: "" },
      { view: "timetable", label: "View Timetable", icon: "" },
    ];

    if (isAdmin()) {
      return [
        ...commonItems,
        { view: "user-management", label: "User Management", icon: "" },
        { view: "teachers", label: "Manage Teachers", icon: "" },
        { view: "classes", label: "Manage Classes", icon: "" },
        { view: "subjects", label: "Manage Subjects", icon: "" },
        { view: "department", label: "Departments", icon: "" },
        { view: "generate", label: "Generate Schedule", icon: "" },
      ];
    }

    if (isHOD()) {
      return [
        ...commonItems,
        { view: "teachers", label: "Department Teachers", icon: "" },
        { view: "classes", label: "Department Classes", icon: "" },
        { view: "subjects", label: "Department Subjects", icon: "" },
        { view: "department", label: "Department", icon: "" },
        { view: "manual", label: "Manual Scheduling", icon: "" },
        { view: "generate", label: "Generate Timetable", icon: "" },
      ];
    }

    if (isFaculty()) {
      return [
        ...commonItems,
        { view: "my-schedule", label: "My Schedule", icon: "" },
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
    <div className="layout">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="top-nav-left">
          <button className="hamburger" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="logo">Timetable System</h1>
        </div>

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
            >
              {/* <span className="nav-icon">{item.icon}</span> */}
              {item.label}
              {/* <hr /> */}
            </button>
          ))}
        </nav>

        <div className="nav-footer">
          {isAdmin() && (
            <button
              className="new-member-btn"
              onClick={() => handleNavClick("user-management")}
            >
               Add New User
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
             Logout
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

export default Navigation;
