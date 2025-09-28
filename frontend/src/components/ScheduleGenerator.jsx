import React, { useState, useEffect } from "react";
import api from "../services/api"; // Adjust path to your API service
import "./ScheduleGenerator.css"; // Your CSS file

const ScheduleGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]); // Track selected classes
  const [subjectsMap, setSubjectsMap] = useState({});
  const [teachersMap, setTeachersMap] = useState({});
  const [loading, setLoading] = useState(false);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6];

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, teachersRes, subjectsRes] = await Promise.all([
          api.get("/classes"),
          api.get("/teachers"),
          api.get("/subjects"),
        ]);

        setClasses(classesRes.data);

        // Debugging logs
        console.log("Subjects Response:", subjectsRes.data);
        console.log("Teachers Response:", teachersRes.data);

        // Safer mapping
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

  // Handle class selection
  const handleClassSelect = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // Check if at least one class is selected
  const hasSelectedClasses = selectedClassIds.length > 0;

  // Generate schedule for selected classes
  const generateSchedule = async () => {
    if (!hasSelectedClasses) {
      setError({ status: "error", message: "Please select at least one class." });
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post("/schedule/generate", {
        classIds: selectedClassIds
      });
      console.log("Frontend received:", response.data);

      setResult({
        status: response.data.status,
        message: response.data.message,
        data: response.data.timetable || [],
        selectedClasses: response.data.selectedClasses || [] // For display if needed
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

  // Get subject + teacher for each cell
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

  // Get class name
  const getClassName = (classId) => {
    const classObj = classes.find((c) => c._id === classId);
    return classObj ? `${classObj.name} - ${classObj.semester || 'N/A'}` : classId;
  };

  // UI Rendering
  if (loading) {
    return (
      <div className="generate-schedule">
        <div className="schedule-header">
          <h2>Generate Automatic Schedule</h2>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="generate-schedule">
      <div className="schedule-header">
        <h2>Generate Automatic Schedule</h2>
        <p>Select classes and click generate to create an optimized timetable.</p>
      </div>

      {/* Class Selection */}
      <div className="class-selection">
        <h3>Select Classes</h3>
        <div className="classes-list">
          {classes.map((cls) => (
            <label key={cls._id} className="class-checkbox">
              <input
                type="checkbox"
                value={cls._id}
                checked={selectedClassIds.includes(cls._id)}
                onChange={() => handleClassSelect(cls._id)}
              />
              {cls.name} - {cls.semester || 'N/A'}
            </label>
          ))}
        </div>
        <p className="selected-info">
          Selected: {selectedClassIds.length} classes
        </p>
      </div>

      {/* Generate Button */}
      <div className="schedule-actions">
        <button
          className={`generate-btn ${generating ? "generating" : ""} ${!hasSelectedClasses ? "disabled" : ""}`}
          onClick={generateSchedule}
          disabled={generating || !hasSelectedClasses}
        >
          {generating ? "Generating..." : `Generate Schedule for ${selectedClassIds.length || 0} Classes`}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error.message}</p>
        </div>
      )}

      {/* Result */}
      {result && result.status === "success" && Array.isArray(result.data) && result.data.length > 0 && (
        <div className="result-container">
          <div className="success-message">
            <h4>✅ {result.message}</h4>
            <p>Your timetable has been created successfully for the selected classes and stored in the database.</p>
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

      {/* No Result Message */}
      {result && result.status === "success" && (!result.data || result.data.length === 0) && (
        <div className="success-message">
          <h4>✅ {result.message}</h4>
          <p>No timetable data returned. Check the backend logs.</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;