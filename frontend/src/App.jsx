import React, { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Navigation from "./components/navigation/Navigation";
import Login from "./components/login/Login";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import HODDashboard from "./components/dashboards/HODDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import Unauthorized from "./components/dashboards/Unauthorized";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import Timetable from "./components/timetable/Timetable";
import ManualScheduler from "./components/manualScheduler/ManualScheduler";
import Teachers from "./components/teachers/Teachers";
import Classes from "./components/classes/Classes";
import Subjects from "./components/subjects/Subjects";
import UserManagement from "./components/userManagement/UserManagement";
import DepartmentManagement from "./components/department/DepartmentManagement";
import ScheduleGenerator from "./components/scheduleGenerator/ScheduleGenerator";
import Department from "./components/department/Department";
import ProtectedRoute from "./components/ProtectedRoute";
import MyTimetable from "./components/MyTimetable";
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
        case "my-schedule":
          return <MyTimetable teacherId={user.teacherId} view="teacher" />;
        default:
          return renderDashboard();
      }
    }

    // Faculty views (read-only)
    if (isFaculty()) {
      switch (activeView) {
        case "my-schedule":
          return <MyTimetable teacherId={user.teacherId} view="teacher" />;
        default:
          return renderDashboard();
      }
    }

    // Student views (read-only)
    if (isStudent()) {
      switch (activeView) {
        case "my-timetable":
          return <MyTimetable studentId={user.studentId} view="student" />;
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
