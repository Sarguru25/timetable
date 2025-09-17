import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./ScheduleGenerator.css";

const ScheduleGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [teachersMap, setTeachersMap] = useState({});

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/teachers"),
        api.get("/subjects"),
      ]);

      setClasses(classesRes.data);

      const subjMap = {};
      subjectsRes.data.forEach((s) => { subjMap[s._id] = s.name; });
      setSubjectsMap(subjMap);

      const teachMap = {};
      teachersRes.data.forEach((t) => { teachMap[t._id] = t.name; });
      setTeachersMap(teachMap);
    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  };

  const generateSchedule = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/schedule/generate", {});
      console.log("Frontend received:", response.data);

      setResult({
        status: response.data.status,
        message: response.data.message,
        data: response.data.timetable || [],   // ✅ fixed
      });
    } catch (err) {
      console.error("Schedule generation error:", err);
      setError({
        status: "error",
        message: err.response?.data?.message || "Failed to generate schedule.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getCellData = (classId, day, period) => {
    if (!result?.data || !Array.isArray(result.data)) return "-";
    const slot = result.data.find((s) => s.classId === classId && s.day === day && s.period === period);
    if (!slot) return "-";

    const subjName = subjectsMap[slot.subjectId] || "Unknown Subject";
    const teacherName = teachersMap[slot.teacherId] || "Unknown Teacher";

    return (
      <div className="schedule-cell">
        <div className="subject-name">{subjName}</div>
        <div className="teacher-name">{teacherName}</div>
      </div>
    );
  };

  const getClassName = (classId) => {
    const classObj = classes.find((c) => c._id === classId);
    return classObj ? `${classObj.name} - ${classObj.semester}` : classId;
  };

  return (
    <div className="generate-schedule">
      <div className="schedule-header">
        <h2>Generate Automatic Schedule</h2>
        <p>Click the button to create an optimized timetable for all classes</p>
      </div>

      <div className="schedule-actions">
        <button
          className={`generate-btn ${generating ? "generating" : ""}`}
          onClick={generateSchedule}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate Automatic Schedule"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error.message}</p>
        </div>
      )}

      {result && result.status === "success" && Array.isArray(result.data) && (
        <div className="result-container">
          <div className="success-message">
            <h4>✅ {result.message}</h4>
            <p>Your timetable has been created with all constraints satisfied.</p>
          </div>

          <div className="timetables-container">
            {Array.from(new Set(result.data.map((s) => s.classId))).map((classId) => (
              <div key={classId} className="class-timetable">
                <h3 className="class-title">{getClassName(classId)}</h3>

                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      {days.map((day) => (
                        <th key={day}>{day.substring(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period}>
                        <td>{period}</td>
                        {days.map((day) => (
                          <td key={day}>{getCellData(classId, day, period)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;
