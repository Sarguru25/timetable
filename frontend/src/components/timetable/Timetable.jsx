import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "./Timetable.css";

const Timetable = ({ user }) => {
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEdit, setShowEdit] = useState(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const periods = [1, 2, 3, 4, 5, 6];

  const canEdit = user && ["admin", "hod"].includes(user.role);

  useEffect(() => {
    api
      .get("/timetable/classes")
      .then((res) => setClasses(res.data.classes || []))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    api
      .get(`/timetable/class/${selectedClass}`)
      .then((res) => setTimetable(res.data.timetable || []))
      .catch((err) => console.error("Error fetching timetable:", err));
  }, [selectedClass]);

  const getSlot = (day, period) =>
    timetable.find((s) => s.day === day && s.period === period);

  const handleSlotClick = (day, period) => {
    if (!canEdit) return;
    const slot = getSlot(day, period) || {};
    setEditingSlot({ day, period });
    setEditForm({
      subject: slot.subject?._id || "",
      teacher: slot.teacher?._id || "",
      room: slot.room?._id || "",
      locked: slot.locked || false,
    });
    setShowEdit(true);
  };

  const handleSave = () => {
    api
      .put("/timetable/slot", {
        classId: selectedClass,
        day: editingSlot.day,
        period: editingSlot.period,
        updates: editForm,
      })
      .then(() => api.get(`/timetable/class/${selectedClass}`))
      .then((res) => {
        setTimetable(res.data.timetable || []);
        setShowEdit(false);
        setEditingSlot(null);
      })
      .catch((err) => console.error("Error saving slot:", err));
  };

  // ✅ Download timetable as CSV
  const handleDownload = () => {
    if (!selectedClass || timetable.length === 0) {
      alert("Please select a class with a timetable first.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += ["Period", ...days].join(",") + "\n";

    periods.forEach((p) => {
      const row = [`P${p}`];
      days.forEach((d) => {
        const slot = getSlot(d, p);
        if (slot) {
          row.push(
            `${slot.subject?.name || ""} - ${slot.teacher?.name || ""} (${
              slot.room?.name || ""
            })`
          );
        } else {
          row.push("Free");
        }
      });
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="timetable-wrapper">
      <h2>Class Timetable</h2>

      {/* Class Selector */}
      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="class-select"
      >
        <option value="">Select Class</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Download Button */}
      {selectedClass && (
        <button className="download-btn" onClick={handleDownload}>
          Download Timetable
        </button>
      )}

      {/* Show timetable only if class is selected */}
      {selectedClass && (
        <div className="timetable-grid-wrapper">
          <div className="timetable-grid">
            {/* Header Row: Empty top-left + Periods */}
            <div className="grid-row">
              <div className="grid-cell header-cell">Day</div>
              {periods.map((p) => (
                <div key={p} className="grid-cell header-cell">
                  P{p}
                </div>
              ))}
            </div>

            {/* Timetable Rows: Each day is a row */}
            {days.map((d) => (
              <div key={d} className="grid-row">
                <div className="grid-cell header-cell">{d}</div>{" "}
                {/* Day label */}
                {periods.map((p) => {
                  const slot = getSlot(d, p);
                  const editable = canEdit && !slot?.locked;

                  return (
                    <div
                      key={`${d}-${p}`}
                      className={`grid-cell slot-cell ${
                        editable ? "editable" : ""
                      } ${slot?.locked ? "locked" : ""}`}
                      onClick={() => handleSlotClick(d, p)}
                    >
                      {slot ? (
                        <>
                          <div className="slot-subject">
                            {slot.subject?.name || "—"}
                          </div>
                          <div className="slot-teacher">
                            {slot.teacher?.name || "—"}
                          </div>
                          <div className="slot-room">
                            {slot.room?.name || ""}
                          </div>
                          {slot.locked && <div className="slot-locked">🔒</div>}
                        </>
                      ) : (
                        "Free"
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              Edit {editingSlot.day} - Period {editingSlot.period}
            </h3>
            <input
              placeholder="Subject ID"
              value={editForm.subject}
              onChange={(e) =>
                setEditForm({ ...editForm, subject: e.target.value })
              }
            />
            <input
              placeholder="Teacher ID"
              value={editForm.teacher}
              onChange={(e) =>
                setEditForm({ ...editForm, teacher: e.target.value })
              }
            />
            <input
              placeholder="Room ID"
              value={editForm.room}
              onChange={(e) =>
                setEditForm({ ...editForm, room: e.target.value })
              }
            />
            <label>
              <input
                type="checkbox"
                checked={editForm.locked}
                onChange={(e) =>
                  setEditForm({ ...editForm, locked: e.target.checked })
                }
              />
              Lock Slot
            </label>
            <div className="modal-buttons">
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-btn" onClick={() => setShowEdit(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
