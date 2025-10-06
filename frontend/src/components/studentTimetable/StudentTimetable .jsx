import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AcademicTimetable.css";
import api from "../../services/api";

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Period times mapping based on your image
  const periodTimes = {
    "Hi": "09:15 AM – 10:10 AM",
    "H2": "10:10 AM – 11:05 AM", 
    "H3": "11:30 AM – 12:25 PM",
    "H4": "12:25 PM – 01:20 PM",
    "H5": "02:15 PM – 03:10 PM",
    "H6": "03:10 PM – 04:05 PM"
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
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

  // Function to get day sessions (similar to your image)
  const getDaySessions = (dayName) => {
    if (!timetableData?.calendar) return [];
    
    const day = timetableData.calendar.find(d => 
      d.day.toLowerCase().includes(dayName.toLowerCase())
    );
    
    return day ? day.sessions : [];
  };

  // Format date like "Mon, 29 Sep 2025"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get day name like "Monday"
  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (loading) {
    return <div className="loading">Loading timetable...</div>;
  }

  return (
    <div className="student-timetable">
      {/* Header similar to your image */}
      <div className="timetable-header">
        <div className="header-content">
          <h1>Time Table</h1>
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
        </div>
      </div>

      {/* Month Header */}
      <div className="month-header">
        <h2>September 2025</h2>
      </div>

      {/* Calendar Grid - Simplified like your image */}
      <div className="calendar-week">
        <div className="week-days">
          <div className="day">Sun</div>
          <div className="day">Mon</div>
          <div className="day">Tue</div>
          <div className="day">Wed</div>
          <div className="day">Thu</div>
          <div className="day">Fri</div>
          <div className="day">Sat</div>
        </div>
        <div className="week-dates">
          <div className="date">28</div>
          <div className="date active">29</div>
          <div className="date">30</div>
          <div className="date">1</div>
          <div className="date">2</div>
          <div className="date">3</div>
          <div className="date">4</div>
        </div>
      </div>

      {/* Day Timetable - Like your image */}
      <div className="day-timetable">
        <div className="day-header">
          <h3>Mon, 29 Sep 2025</h3>
        </div>

        <div className="periods-list">
          {/* Period Hi */}
          <div className="period-item">
            <div className="period-header">
              <span className="period-code">Hi</span>
              <span className="period-time">09:15 AM – 10:10 AM</span>
            </div>
            <div className="period-details">
              <div className="subject">Core Paper XII – Data Structure (Theory)</div>
              <div className="teacher">Srinivasan A</div>
            </div>
          </div>

          {/* Period H2 */}
          <div className="period-item">
            <div className="period-header">
              <span className="period-code">H2</span>
              <span className="period-time">10:10 AM – 11:05 AM</span>
            </div>
            <div className="period-details">
              <div className="subject">Elective I : Business Finance</div>
              <div className="teacher">Supriya A</div>
            </div>
          </div>

          {/* Period H3 */}
          <div className="period-item">
            <div className="period-header">
              <span className="period-code">H3</span>
              <span className="period-time">11:30 AM – 12:25 PM</span>
            </div>
            <div className="period-details">
              <div className="subject">Core Paper IX – Cost Accounting</div>
              <div className="teacher">Prena R</div>
            </div>
          </div>

          {/* Period H4 */}
          <div className="period-item">
            <div className="period-header">
              <span className="period-code">H4</span>
              <span className="period-time">12:25 PM – 01:20 PM</span>
            </div>
            <div className="period-details">
              <div className="subject">Core Paper XII – Data Structure (Theory)</div>
              <div className="teacher">Srinivasan A</div>
            </div>
          </div>

          {/* Period H5 */}
          <div className="period-item">
            <div className="period-header">
              <span className="period-code">H5</span>
              <span className="period-time">02:15 PM – 03:10 PM</span>
            </div>
            <div className="period-details">
              <div className="subject">Free Period / Break</div>
              <div className="teacher">-</div>
            </div>
          </div>
        </div>
      </div>

      {/* If you want to show dynamic data from API, use this instead: */}
      {timetableData && (
        <div className="dynamic-timetable" style={{display: 'none'}}>
          <div className="day-header">
            <h3>{formatDate(currentDate)}</h3>
          </div>
          
          <div className="periods-list">
            {getDaySessions(getDayName(currentDate)).map((session, index) => (
              <div key={session._id || index} className="period-item">
                <div className="period-header">
                  <span className="period-code">H{index + 1}</span>
                  <span className="period-time">
                    {periodTimes[`H${index + 1}`] || session.time}
                  </span>
                </div>
                <div className="period-details">
                  <div className="subject">
                    {session.subject?.name || session.courseName}
                  </div>
                  <div className="teacher">
                    {session.teacher?.name || session.instructor}
                  </div>
                  {session.teacherMessage && (
                    <div className="message">
                      📝 {session.teacherMessage}
                    </div>
                  )}
                  {session.isCancelled && (
                    <div className="cancelled-badge">
                      ❌ Cancelled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;