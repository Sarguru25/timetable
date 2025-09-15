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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1>Timetable System</h1>
        <div className="user-info">
          Logged in as: {user?.name} ({user?.role})
        </div>
      </div>

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
            >
              Manual Scheduling
            </button>
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

export default Navigation;
