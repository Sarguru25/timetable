import React, { useState, useContext } from "react";
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
import "./App.css";

function App() {
  const { user, loading } = useContext(AuthContext);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

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
    }
  };

  return (
    <div className="App">
      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedTeacher={selectedTeacher}
        setSelectedTeacher={setSelectedTeacher}
        user={user}
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;