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
    // Pre-fetch classes, teachers, and subjects for better UX
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

      // Build lookup maps
      const subjMap = {};
      subjectsRes.data.forEach((s) => {
        subjMap[s._id] = s.name;
      });
      setSubjectsMap(subjMap);

      const teachMap = {};
      teachersRes.data.forEach((t) => {
        teachMap[t._id] = t.name;
      });
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
      let fixedSlots = [];
      try {
        const fixedSlotsRes = await api.get("/timetable/fixed-slots");
        fixedSlots = fixedSlotsRes.data;
      } catch (err) {
        console.warn("Fixed slots endpoint not available, continuing without fixed slots");
      }

      const scheduleData = {
        classes,
        teachers: Object.values(teachersMap).map(id => ({ id })), // Simplified for backend
        subjects: Object.values(subjectsMap).map(id => ({ id })), // Simplified for backend
        fixedSlots,
      };

      // Call backend schedule generation
      const response = await api.post("/schedule/generate", scheduleData);

      setResult({
        status: "success",
        message: "Schedule generated successfully!",
        data: response.data.schedule || response.data, // Handle both formats
        statistics: response.data.statistics || {}
      });

    } catch (err) {
      console.error("Schedule generation error:", err);
      setError({
        status: "error",
        message: err.response?.data?.message || "Failed to generate schedule. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getCellData = (classId, day, period) => {
    if (!result?.data) return null;
    
    const slot = Array.isArray(result.data) 
      ? result.data.find(s => s.classId === classId && s.day === day && s.period === period)
      : null;

    if (!slot) return "-";

    const subjName = subjectsMap[slot.subjectId] || slot.subjectId;
    const teacherName = teachersMap[slot.teacherId] || slot.teacherId;
    
    return (
      <div className="schedule-cell">
        <div className="subject-name">{subjName}</div>
        <div className="teacher-name">{teacherName}</div>
      </div>
    );
  };

  const getClassName = (classId) => {
    const classObj = classes.find(c => c._id === classId);
    return classObj ? `${classObj.name} - ${classObj.semester}` : classId;
  };

  const downloadSchedule = () => {
    const dataStr = JSON.stringify(result.data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `timetable-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="generate-schedule">
      <div className="schedule-header">
        <h2>Generate Automatic Schedule</h2>
        <p>Click the button to create an optimized timetable for all classes</p>
      </div>

      <div className="schedule-actions">
        <button
          className={`generate-btn ${generating ? 'generating' : ''}`}
          onClick={generateSchedule}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="spinner"></span>
              Generating Schedule...
            </>
          ) : (
            'Generate Automatic Schedule'
          )}
        </button>

        {result && (
          <div className="action-buttons">
            <button className="download-btn" onClick={downloadSchedule}>
              Download Schedule
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error.message}</p>
          <p className="error-hint">
            Please make sure all required data (teachers, classes, subjects) has been entered.
          </p>
        </div>
      )}

      {result && result.status === "success" && (
        <div className="result-container">
          <div className="success-message">
            <h4>✅ Schedule Generated Successfully!</h4>
            <p>Your timetable has been created with all constraints satisfied.</p>
            
            {result.statistics && (
              <div className="statistics">
                <p><strong>Total Slots:</strong> {result.statistics.totalSlots}</p>
                <p><strong>Scheduled Slots:</strong> {result.statistics.scheduledSlots}</p>
                <p><strong>Utilization Rate:</strong> {result.statistics.utilizationRate}</p>
              </div>
            )}
          </div>

          <div className="timetables-container">
            {Array.from(new Set(result.data.map(s => s.classId))).map(classId => (
              <div key={classId} className="class-timetable">
                <h3 className="class-title">{getClassName(classId)}</h3>
                
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th className="period-header">Period</th>
                      {days.map(day => (
                        <th key={day} className="day-header">{day.substring(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map(period => (
                      <tr key={period}>
                        <td className="period-cell">{period}</td>
                        {days.map(day => (
                          <td key={day} className="schedule-slot">
                            {getCellData(classId, day, period)}
                          </td>
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

      {!result && !generating && (
        <div className="info-section">
          <h4>How It Works</h4>
          <ul>
            <li>Automatically distributes subjects across 6 days and 6 periods</li>
            <li>Ensures no teacher is scheduled for multiple classes at the same time</li>
            <li>Respects subject hours per week requirements</li>
            <li>Considers teacher availability and preferences</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;