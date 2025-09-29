import React, { useEffect, useState } from "react";

const TimetablePage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [currentDay, setCurrentDay] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [editingDescription, setEditingDescription] = useState(null);
  const [descriptionText, setDescriptionText] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get current day and date
  const getCurrentDayAndDate = () => {
    const today = new Date();
    const dayIndex = today.getDay();
    const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const displayDay = dayIndex === 0 ? "Monday" : days[adjustedDayIndex];
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    
    return { day: displayDay, date: formattedDate };
  };

  // Get user role from token
  const getUserRole = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
      } catch (error) {
        console.error("Error decoding token:", error);
        return "";
      }
    }
    return "";
  };

  // Fetch classes once on mount
  useEffect(() => {
    const { day, date } = getCurrentDayAndDate();
    setCurrentDay(day);
    setCurrentDate(date);
    setUserRole(getUserRole());

    fetch("http://localhost:5000/api/timetable/classes", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setClasses(data.classes);
      })
      .catch(err => console.error("Error fetching classes:", err));
  }, []);

  // Fetch timetable whenever selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/timetable/class/${selectedClass}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTimetable(data.timetable);
      })
      .catch(err => console.error("Error fetching timetable:", err))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  // Filter and sort timetable by current day and period
  const daySlots = timetable
    .filter(slot => slot.day === currentDay)
    .sort((a, b) => a.period - b.period);

  // Function to get period background color
  const getPeriodColor = (period, description) => {
    // If there's a description (faculty can't come), use red color
    if (description && (userRole === 'hod' || userRole === 'faculty')) {
      return "#ffebee"; // Light red
    }
    
    const colors = {
      1: "#e3f2fd", // Light blue
      2: "#f3e5f5", // Light purple
      3: "#e8f5e8", // Light green
      4: "#fff3e0", // Light orange
      5: "#fce4ec", // Light pink
      6: "#e0f2f1", // Light teal
    };
    return colors[period] || "#f5f5f5";
  };

  // Function to get period text color
  const getPeriodTextColor = (period, description) => {
    // If there's a description (faculty can't come), use dark red color
    if (description && (userRole === 'hod' || userRole === 'faculty')) {
      return "#c62828"; // Dark red
    }
    
    const colors = {
      1: "#1565c0", // Dark blue
      2: "#7b1fa2", // Dark purple
      3: "#2e7d32", // Dark green
      4: "#ef6c00", // Dark orange
      5: "#c2185b", // Dark pink
      6: "#00695c", // Dark teal
    };
    return colors[period] || "#424242";
  };

  // Handle description update
  const handleDescriptionUpdate = async (slot) => {
    if (!descriptionText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/timetable/slot/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          classId: selectedClass,
          day: slot.day,
          period: slot.period,
          description: descriptionText
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        const updatedTimetable = timetable.map(t => 
          t.day === slot.day && t.period === slot.period 
            ? { ...t, description: descriptionText }
            : t
        );
        setTimetable(updatedTimetable);
        setEditingDescription(null);
        setDescriptionText("");
      }
    } catch (error) {
      console.error("Error updating description:", error);
    }
  };

  // Start editing description
  const startEditingDescription = (slot) => {
    setEditingDescription(`${slot.day}-${slot.period}`);
    setDescriptionText(slot.description || "");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDescription(null);
    setDescriptionText("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Class Timetable</h2>
        <div style={styles.dateDisplay}>
          <div style={styles.currentDay}>{currentDay}</div>
          <div style={styles.currentDate}>{currentDate}</div>
        </div>
      </div>

      {/* Class Selector */}
      <div style={styles.dropdownContainer}>
        <label style={styles.label}>Select Class:</label>
        <select
          style={styles.select}
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
        >
          <option value="">-- Choose a Class --</option>
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>
              {cls.name} ({cls.department})
            </option>
          ))}
        </select>
      </div>

      {/* Day Switcher */}
      <div style={styles.daySwitcher}>
        {days.map(day => (
          <button
            key={day}
            onClick={() => setCurrentDay(day)}
            style={{
              ...styles.dayButton,
              backgroundColor: currentDay === day ? "#007BFF" : "#f0f0f0",
              color: currentDay === day ? "#fff" : "#000",
              fontWeight: currentDay === day ? "bold" : "normal"
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Display */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <p>Loading timetable...</p>
        </div>
      ) : selectedClass ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Period</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Teacher</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {daySlots.length > 0 ? (
                daySlots.map((slot, idx) => {
                  const isEditing = editingDescription === `${slot.day}-${slot.period}`;
                  const hasDescription = slot.description && (userRole === 'hod' || userRole === 'faculty');
                  
                  return (
                    <tr key={idx} style={styles.tr}>
                      <td style={{
                        ...styles.td,
                        ...styles.periodCell,
                        backgroundColor: getPeriodColor(slot.period, slot.description),
                        color: getPeriodTextColor(slot.period, slot.description),
                        fontWeight: "bold",
                        fontSize: "16px"
                      }}>
                        {slot.period}
                      </td>
                      <td style={styles.td}>{slot.subject?.name || "—"}</td>
                      <td style={styles.td}>{slot.teacher?.name || "—"}</td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <div style={styles.editContainer}>
                            <textarea
                              value={descriptionText}
                              onChange={(e) => setDescriptionText(e.target.value)}
                              placeholder="Enter description (e.g., Faculty unavailable)"
                              style={styles.textarea}
                              rows="3"
                            />
                            <div style={styles.editButtons}>
                              <button 
                                onClick={() => handleDescriptionUpdate(slot)}
                                style={styles.saveButton}
                              >
                                Save
                              </button>
                              <button 
                                onClick={cancelEditing}
                                style={styles.cancelButton}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            style={{
                              ...styles.descriptionCell,
                              cursor: (userRole === 'hod' || userRole === 'faculty') ? 'pointer' : 'default'
                            }}
                            onClick={() => (userRole === 'hod' || userRole === 'faculty') && startEditingDescription(slot)}
                          >
                            {slot.description || (userRole === 'hod' || userRole === 'faculty' ? "Click to add description" : "—")}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={styles.td} colSpan="4">
                    No timetable for {currentDay}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.placeholder}>
          <p>Please select a class to view timetable.</p>
        </div>
      )}
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
    backgroundColor: "#f8f9fa"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #e0e0e0"
  },
  title: {
    margin: 0,
    color: "#2c3e50",
    fontSize: "28px"
  },
  dateDisplay: {
    textAlign: "right"
  },
  currentDay: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: "5px"
  },
  currentDate: {
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic"
  },
  dropdownContainer: {
    marginBottom: "20px",
    textAlign: "center",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  label: {
    marginRight: "10px",
    fontWeight: "bold",
    fontSize: "16px"
  },
  select: {
    padding: "10px 15px",
    fontSize: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    minWidth: "250px"
  },
  daySwitcher: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "8px",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  dayButton: {
    padding: "10px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    border: "1px solid #e0e0e0",
    padding: "15px",
    backgroundColor: "#2c3e50",
    color: "white",
    textAlign: "left",
    fontSize: "16px",
    fontWeight: "bold"
  },
  td: {
    border: "1px solid #e0e0e0",
    padding: "15px",
    fontSize: "15px",
    verticalAlign: "top"
  },
  tr: {
    transition: "background-color 0.2s ease"
  },
  periodCell: {
    textAlign: "center",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  descriptionCell: {
    minHeight: "40px",
    padding: "8px",
    borderRadius: "4px",
    backgroundColor: "#f8f9fa",
    transition: "background-color 0.2s ease"
  },
  editContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  textarea: {
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    resize: "vertical"
  },
  editButtons: {
    display: "flex",
    gap: "8px"
  },
  saveButton: {
    padding: "6px 12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  },
  cancelButton: {
    padding: "6px 12px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#666"
  },
  placeholder: {
    textAlign: "center",
    padding: "40px",
    fontSize: "16px",
    color: "#666",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }
};

export default TimetablePage;