import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./ScheduleGenerator.css";

const ScheduleGenerator = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  const [teachersMap, setTeachersMap] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6];

  // ✅ Fetch initial data
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/teachers"),
        api.get("/subjects"),
      ]);

      setClasses(classesRes.data);

      // 👇 Debugging logs
      console.log("Subjects Response:", subjectsRes.data);
      console.log("Teachers Response:", teachersRes.data);

      // 👇 Safer mapping
      const subjMap = {};
      subjectsRes.data.forEach((s) => {
        if (s && s._id) {
          subjMap[s._id] = s.name;
        } else {
          console.warn("Invalid subject entry:", s);
        }
      });
      setSubjectsMap(subjMap);

      const teachMap = {};
      teachersRes.data.forEach((t) => {
        if (t && t._id) {
          teachMap[t._id] = t.name;
        } else {
          console.warn("Invalid teacher entry:", t);
        }
      });
      setTeachersMap(teachMap);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError({
        status: "error",
        message: "Failed to fetch classes, subjects, or teachers.",
      });
      setLoading(false);
    }
  };

  fetchInitialData();
}, []);


  // ✅ Generate schedule
  const generateSchedule = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/schedule/generate");
      console.log("Frontend received:", response.data);

      setResult({
        status: response.data.status,
        message: response.data.message,
        data: response.data.timetable || [],
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

  // ✅ Get subject + teacher for each cell
  const getCellData = (classId, day, period) => {
    if (!result?.data || !Array.isArray(result.data)) return "-";

    const slot = result.data.find(
      (s) => s.classId === classId && s.day === day && s.period === period
    );
    if (!slot) return "-";

    return (
      <div className="schedule-cell">
        <div className="subject-name">{subjectsMap[slot.subjectId] || "Unknown Subject"}</div>
        <div className="teacher-name">{teachersMap[slot.teacherId] || "Unknown Teacher"}</div>
      </div>
    );
  };

  // ✅ Get class name
  const getClassName = (classId) => {
    const classObj = classes.find((c) => c._id === classId);
    return classObj ? `${classObj.name} - ${classObj.semester}` : classId;
  };

  // ✅ UI Rendering
  return (
    <div className="generate-schedule">
      <div className="schedule-header">
        <h2>Generate Automatic Schedule</h2>
        <p>Click the button to create an optimized timetable for all classes</p>
      </div>

      {/* Loading */}
      {loading && <p className="loading">Loading data...</p>}

      {/* Generate Button */}
      {!loading && (
        <div className="schedule-actions">
          <button
            className={`generate-btn ${generating ? "generating" : ""}`}
            onClick={generateSchedule}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Automatic Schedule"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error.message}</p>
        </div>
      )}

      {/* Result */}
      {result && result.status === "success" && Array.isArray(result.data) && (
        <div className="result-container">
          <div className="success-message">
            <h4>✅ {result.message}</h4>
            <p>Your timetable has been created successfully.</p>
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
