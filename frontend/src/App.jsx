import React, { useState, useContext } from "react";
<<<<<<< Updated upstream
import { AuthContext } from "./context/AuthContext.jsx";
import Navigation from "./components/Navigation.jsx";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Timetable from "./components/Timetable.jsx";
import ManualScheduler from "./components/ManualScheduler.jsx";
import Teachers from "./components/Teachers.jsx";
import Classes from "./components/Classes.jsx";
import Subjects from "./components/Subjects.jsx";
import FirstLogin from "./components/FirstLogin.jsx";
import ScheduleGenerator from "./components/ScheduleGenerator.jsx";
=======
import { AuthContext } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import Login from "./components/Login";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import HODDashboard from "./components/dashboards/HODDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import Unauthorized from "./components/dashboards/Unauthorized";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import Timetable from "./components/Timetable";
import ManualScheduler from "./components/ManualScheduler";
import Teachers from "./components/Teachers";
import Classes from "./components/Classes";
import Subjects from "./components/Subjects";
import UserManagement from "./components/UserManagement";
import DepartmentManagement from "./components/DepartmentManagement";
import ScheduleGenerator from "./components/ScheduleGenerator";
import Department from "./components/Department";
import ProtectedRoute from "./components/ProtectedRoute";
>>>>>>> Stashed changes
import "./App.css";

function App() {
  const { user, loading, isAdmin, isHOD, isFaculty, isStudent } =
    useContext(AuthContext);
  const [activeView, setActiveView] = useState("dashboard");

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

<<<<<<< Updated upstream
  if (user.firstLogin) {
    return <FirstLogin />;
  }

  const renderContent = () => {
    switch (activeView) {
      case "timetable":
        return (
          <Timetable
            classId={selectedClass}
            teacherId={selectedTeacher}
            view={selectedClass ? "class" : "teacher"}
          />
        );
      case "teachers":
        return <Teachers />;
      case "classes":
        return <Classes />;
      case "subjects":
        return <Subjects />;
      case "manual":
        return <ManualScheduler teacherId={user.teacherId || user.id} />;
      case "generate":
        return <ScheduleGenerator />;
      default:
        return <Dashboard setActiveView={setActiveView} user={user} />;
=======
  // Role-based dashboard rendering
  const renderDashboard = () => {
    if (isAdmin()) {
      return <AdminDashboard setActiveView={setActiveView} user={user} />;
    } else if (isHOD()) {
      return <HODDashboard setActiveView={setActiveView} user={user} />;
    } else if (isFaculty()) {
      return <FacultyDashboard setActiveView={setActiveView} user={user} />;
    } else if (isStudent()) {
      return <StudentDashboard setActiveView={setActiveView} user={user} />;
>>>>>>> Stashed changes
    }
    return <Unauthorized />;
  };

  // Role-based content rendering with access control
  const renderContent = () => {
    // Common views for all roles
    if (activeView === "timetable") {
      return <Timetable user={user} />;
    }

    // Admin-only views
    if (isAdmin()) {
      switch (activeView) {
        case "user-management":
          return <UserManagement />;
        case "department-management":
          return <DepartmentManagement />;
        case "teachers":
          return <Teachers />;
        case "classes":
          return <Classes />;
        case "subjects":
          return <Subjects />;
        case "department":
          return <Department />;
        case "generate":
          return <ScheduleGenerator />;
        default:
          return renderDashboard();
      }
    }

    // HOD-only views
    if (isHOD()) {
      switch (activeView) {
        case "teachers":
          return <Teachers department={user.department} />;
        case "classes":
          return <Classes department={user.department} />;
        case "subjects":
          return <Subjects department={user.department} />;
        case "manual":
          return <ManualScheduler department={user.department} />;
        case "generate":
          return <ScheduleGenerator department={user.department} />;
        case "department":
          return <Department department={user.department} />;
        default:
          return renderDashboard();
      }
    }

    // Faculty views (read-only)
    if (isFaculty()) {
      switch (activeView) {
        case "my-schedule":
          return <Timetable teacherId={user.teacherId} view="teacher" />;
        default:
          return renderDashboard();
      }
    }

    // Student views (read-only)
    if (isStudent()) {
      switch (activeView) {
        case "my-timetable":
          return <Timetable studentId={user.studentId} view="student" />;
        default:
          return renderDashboard();
      }
    }

    return renderDashboard();
  };

  return (
    <div className="App">
      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        isAdmin={isAdmin}
        isHOD={isHOD}
        isFaculty={isFaculty}
        isStudent={isStudent}
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;