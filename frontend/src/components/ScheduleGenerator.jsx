import React, { useState } from "react";
import api from "../services/api";

const ScheduleGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateSchedule = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Fetch required data
      const [classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/teachers"),
        api.get("/subjects"),
      ]);

      // Try fixed slots (optional)
      let fixedSlots =  [];
      try {
        const fixedSlotsRes = await api.get("/timetable/fixed-slots");
        fixedSlots = fixedSlotsRes.data;
      } catch (err) {
        console.warn("No fixed slots endpoint found, skipping...");
      }

      // Data payload
      const scheduleData = {
        classes: classesRes.data,
        teachers: teachersRes.data,
        subjects: subjectsRes.data,
        fixedSlots,
      };

      // Call backend
      const response = await api.post("/schedule/generate", scheduleData);

      setResult({
        status: "success",
        message: "Schedule generated successfully!",
        data: response.data,
      });
    } catch (err) {
      console.error("Schedule generation error:", err);
      setError({
        status: "error",
        message:
          err.response?.data?.message ||
          "Failed to generate schedule. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="generate-schedule">
      <h2>Generate Automatic Schedule</h2>
      <p>Click the button to create an optimized timetable</p>

      <button
        className="btn-primary"
        onClick={generateSchedule}
        disabled={generating}
      >
        {generating ? "Generating..." : "Generate Schedule"}
      </button>

      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error.message}</p>
        </div>
      )}

      {result && result.status === "success" && (
        <div className="success-message">
          <h4>{result.message}</h4>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ScheduleGenerator;
