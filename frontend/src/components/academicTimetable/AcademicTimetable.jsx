import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AcademicTimetable.css";
import api from "../../services/api";

const AcademicTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    teacherMessage: "",
    cancellationReason: "",
    bookingMessage: ""
  });
  const [activeView, setActiveView] = useState("weekly"); // "weekly" or "available"

  // Period times mapping
  const periodTimes = {
    1: "09:15 AM – 10:10 AM",
    2: "10:10 AM – 11:05 AM", 
    3: "11:30 AM – 12:25 PM",
    4: "12:25 PM – 01:20 PM",
    5: "02:15 PM – 03:10 PM",
    6: "03:10 PM – 04:05 PM"
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      fetchAvailableSessions();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes");
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/academic-timetable/class/${selectedClass}`);
      setTimetableData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      setLoading(false);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const response = await api.get("/academic-timetable/available-sessions");
      setAvailableSessions(response.data);
    } catch (error) {
      console.error("Error fetching available sessions:", error);
    }
  };

  const handleAddMessage = (session, timetableId) => {
    setSelectedSession({ ...session, timetableId });
    setFormData({ teacherMessage: session.teacherMessage || "" });
    setShowMessageModal(true);
  };

  const handleCancelSession = (session, timetableId) => {
    setSelectedSession({ ...session, timetableId });
    setFormData({ cancellationReason: session.cancellationReason || "" });
    setShowCancelModal(true);
  };

  const handleBookSession = (session) => {
    setSelectedSession(session);
    setFormData({ bookingMessage: "" });
    setShowBookModal(true);
  };

  const submitMessage = async () => {
    try {
      await api.put(
        `/academic-timetable/session/${selectedSession.timetableId}/${selectedSession._id}/message`,
        { teacherMessage: formData.teacherMessage }
      );
      setShowMessageModal(false);
      fetchTimetable();
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Failed to update message");
    }
  };

  const submitCancellation = async () => {
    try {
      await api.put(
        `/academic-timetable/session/${selectedSession.timetableId}/${selectedSession._id}/cancel`,
        { cancellationReason: formData.cancellationReason }
      );
      setShowCancelModal(false);
      fetchTimetable();
      fetchAvailableSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      alert("Failed to cancel session");
    }
  };

  const submitBooking = async () => {
    try {
      await api.put(
        `/academic-timetable/session/${selectedSession.timetableId}/${selectedSession._id}/book`,
        { bookingMessage: formData.bookingMessage }
      );
      setShowBookModal(false);
      fetchTimetable();
      fetchAvailableSessions();
      alert("Session booked successfully!");
    } catch (error) {
      console.error("Error booking session:", error);
      alert("Failed to book session");
    }
  };

  const getSessionColor = (session) => {
    if (session.isCancelled) {
      return session.bookedBy ? "booked" : "cancelled";
    }
    return "normal";
  };

  if (loading) {
    return <div className="loading">Loading timetable...</div>;
  }

  return (
    <div className="academic-timetable">
      {/* Header */}
      <div className="timetable-header">
        <div className="header-content">
          <h1>📅 Academic Timetable</h1>
          <p>Manage your classes and communicate with students</p>
        </div>
        
        <div className="header-controls">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="class-select"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - Year {cls.year} - Section {cls.section}
              </option>
            ))}
          </select>

          <div className="view-toggles">
            <button 
              className={`toggle-btn ${activeView === "weekly" ? "active" : ""}`}
              onClick={() => setActiveView("weekly")}
            >
              Weekly View
            </button>
            <button 
              className={`toggle-btn ${activeView === "available" ? "active" : ""}`}
              onClick={() => setActiveView("available")}
            >
              Available Slots ({availableSessions.length})
            </button>
          </div>
        </div>
      </div>

      {activeView === "weekly" && timetableData && (
        <div className="weekly-timetable">
          <div className="timetable-info">
            <h2>{timetableData.classInfo?.name} - {timetableData.timetable?.semester}</h2>
            <span className="academic-year">{timetableData.timetable?.academicYear}</span>
          </div>

          {/* Weekly Calendar */}
          <div className="calendar-grid">
            {timetableData.calendar?.map(day => (
              <div key={day.date} className="day-column">
                <div className="day-header">
                  <div className="day-name">{day.day}</div>
                  <div className="date">{new Date(day.date).getDate()}</div>
                </div>
                
                <div className="sessions-container">
                  {day.sessions.map(session => (
                    <div 
                      key={session._id} 
                      className={`session-card ${getSessionColor(session)}`}
                    >
                      <div className="session-time">
                        {periodTimes[session.period]}
                      </div>
                      
                      <div className="session-content">
                        <div className="subject-name">
                          {session.subject?.name}
                        </div>
                        <div className="teacher-name">
                          {session.teacher?.name}
                        </div>
                        
                        {session.teacherMessage && (
                          <div className="teacher-message">
                            💬 {session.teacherMessage}
                          </div>
                        )}
                        
                        {session.isCancelled && (
                          <div className="cancelled-info">
                            ❌ Cancelled
                            {session.cancellationReason && (
                              <span>: {session.cancellationReason}</span>
                            )}
                          </div>
                        )}
                        
                        {session.bookedBy && (
                          <div className="booked-info">
                            ✅ Booked by: {session.bookedBy?.name}
                            {session.bookingMessage && (
                              <div>Message: {session.bookingMessage}</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="session-actions">
                        <button
                          className="btn-message"
                          onClick={() => handleAddMessage(session, timetableData.timetable._id)}
                          title="Add message"
                        >
                          💬
                        </button>
                        
                        {!session.isCancelled && (
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancelSession(session, timetableData.timetable._id)}
                            title="Cancel class"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {day.sessions.length === 0 && (
                    <div className="no-session">
                      No classes scheduled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === "available" && (
        <div className="available-sessions">
          <h2>Available Sessions for Booking</h2>
          
          {availableSessions.length === 0 ? (
            <div className="no-sessions">
              <p>No available sessions for booking at the moment.</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {availableSessions.map(session => (
                <div key={session._id} className="available-session-card">
                  <div className="session-header">
                    <h4>{session.subject?.name}</h4>
                    <span className="class-info">
                      {session.className} - Sec {session.classSection}
                    </span>
                  </div>
                  
                  <div className="session-details">
                    <div className="detail">
                      <strong>Day:</strong> {session.day}
                    </div>
                    <div className="detail">
                      <strong>Period:</strong> {session.period} ({periodTimes[session.period]})
                    </div>
                    <div className="detail">
                      <strong>Original Teacher:</strong> {session.teacher?.name}
                    </div>
                    <div className="detail">
                      <strong>Reason:</strong> {session.cancellationReason}
                    </div>
                  </div>

                  <button
                    className="btn-book"
                    onClick={() => handleBookSession(session)}
                  >
                    Book This Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Message for Class</h3>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="session-info">
                <strong>{selectedSession?.subject?.name}</strong>
                <br />
                {selectedSession?.day} - Period {selectedSession?.period}
              </div>
              
              <textarea
                value={formData.teacherMessage}
                onChange={(e) => setFormData({ ...formData, teacherMessage: e.target.value })}
                placeholder="Enter your message for students (e.g., submission deadline, important notes...)"
                rows="4"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-primary" onClick={submitMessage}>
                Save Message
              </button>
              <button className="btn-secondary" onClick={() => setShowMessageModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Cancel Class Session</h3>
              <button className="close-btn" onClick={() => setShowCancelModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="session-info">
                <strong>{selectedSession?.subject?.name}</strong>
                <br />
                {selectedSession?.day} - Period {selectedSession?.period}
              </div>
              
              <p className="warning-text">
                This will mark the session as cancelled and make it available for other teachers to book.
              </p>
              
              <textarea
                value={formData.cancellationReason}
                onChange={(e) => setFormData({ ...formData, cancellationReason: e.target.value })}
                placeholder="Reason for cancellation..."
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-danger" onClick={submitCancellation}>
                Confirm Cancellation
              </button>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Session Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Book Available Session</h3>
              <button className="close-btn" onClick={() => setShowBookModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="session-info">
                <strong>{selectedSession?.subject?.name}</strong>
                <br />
                {selectedSession?.className} - {selectedSession?.day} - Period {selectedSession?.period}
                <br />
                <small>Originally by: {selectedSession?.teacher?.name}</small>
              </div>
              
              <textarea
                value={formData.bookingMessage}
                onChange={(e) => setFormData({ ...formData, bookingMessage: e.target.value })}
                placeholder="Add any notes for this booking..."
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-primary" onClick={submitBooking}>
                Book Session
              </button>
              <button className="btn-secondary" onClick={() => setShowBookModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicTimetable;