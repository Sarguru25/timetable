import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../services/api";
 

 
const Timetable = ({ classId, view }) => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = async () => {
  setLoading(true);
  try {
    let endpoint = "";

    if (view === "class") {
      if (!classId) {
        console.warn("No classId provided");
        return; // stops API call, but finally will still run
      }
      endpoint = `timetable/class/${classId}`;
    } else if (view === "teacher") {
      const teacherId = localStorage.getItem("teacherId");
      if (!teacherId) {
        console.error("No teacherId found in localStorage!");
        return; // stops API call, but finally will still run
      }
      endpoint = `timetable/teacher/${teacherId}`;
    }

    if (!endpoint) {
      console.warn("No endpoint set, skipping fetch.");
      return;
    }

    const response = await api.get(endpoint);
    console.log("Fetched timetable:", response.data);

    setTimetable(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    setTimetable([]);
  } finally {
    setLoading(false); // ✅ ALWAYS runs
  }
};

  const renderTimetable = () => {
    if (loading) return <div>Loading...</div>;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periods = Array.from({ length: 8 }, (_, i) => i + 1);

    return (
      <div className="timetable-container">
        <h2>{view === "class" ? "Class" : "Teacher"} Timetable</h2>
        <table className="timetable">
          <thead>
            <tr>
              <th>Time</th>
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td>Period {period}</td>
                {days.map((day, dayIndex) => {
                  const slot = timetable.find(
                    (cell) =>
                      cell.day === dayIndex && cell.period === period - 1
                  );

                  return (
                    <td key={dayIndex} className={slot?.locked ? "locked" : ""}>
                      {slot ? (
                        <div>
                          <div>{slot.subject?.name || "—"}</div>
                          <div>{slot.teacher?.name || "—"}</div>
                          <div>{slot.room?.name || "—"}</div>
                        </div>
                      ) : (
                        "Free"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return renderTimetable();
};

export default Timetable;
