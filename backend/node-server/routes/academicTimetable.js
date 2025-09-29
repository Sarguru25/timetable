const express = require("express");
const TimetableCell = require("../models/TimetableCell.js");
const Class = require("../models/Class.js");
const Subject = require("../models/Subject.js");
const Teacher = require("../models/Teacher.js");
const { auth } = require("../middleware/auth.js");
const router = express.Router();

// Get academic timetable for a class with calendar integration
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, semester } = req.query;

    // Find timetable for the class
    const timetable = await TimetableCell.findOne({
      class: classId,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester: semester || 'Semester 1'
    })
    .populate('class')
    .populate('timetable.subject')
    .populate('timetable.teacher')
    .populate('timetable.bookedBy')
    .populate('timetable.room');

    if (!timetable) {
      return res.status(404).json({ 
        message: "Timetable not found for this class" 
      });
    }

    // Generate calendar data for the current week
    const calendarData = generateWeeklyCalendar(timetable.timetable);

    res.json({
      timetable,
      calendar: calendarData,
      classInfo: timetable.class
    });
  } catch (error) {
    console.error("Get academic timetable error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all academic timetables for a teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, semester } = req.query;

    const timetables = await TimetableCell.find({
      'timetable.teacher': teacherId,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester: semester || 'Semester 1'
    })
    .populate('class')
    .populate('timetable.subject')
    .populate('timetable.teacher')
    .populate('timetable.room');

    const teacherSchedule = timetables.flatMap(timetable => 
      timetable.timetable.filter(session => 
        session.teacher && session.teacher._id.toString() === teacherId
      ).map(session => ({
        ...session.toObject(),
        className: timetable.class.name,
        classYear: timetable.class.year,
        classSection: timetable.class.section
      }))
    );

    res.json(teacherSchedule);
  } catch (error) {
    console.error("Get teacher timetable error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update teacher message for a session
router.put('/session/:timetableId/:sessionId/message', auth, async (req, res) => {
  try {
    const { timetableId, sessionId } = req.params;
    const { teacherMessage } = req.body;
    const teacherId = req.user.id; // Assuming user ID is teacher ID

    const timetable = await TimetableCell.findOne({
      _id: timetableId,
      'timetable._id': sessionId,
      'timetable.teacher': teacherId
    });

    if (!timetable) {
      return res.status(404).json({ 
        message: "Session not found or you are not the assigned teacher" 
      });
    }

    const session = timetable.timetable.id(sessionId);
    session.teacherMessage = teacherMessage;
    session.updatedAt = new Date();

    await timetable.save();

    const updatedTimetable = await TimetableCell.findById(timetableId)
      .populate('timetable.subject')
      .populate('timetable.teacher')
      .populate('timetable.room');

    res.json({
      message: "Message updated successfully",
      session: updatedTimetable.timetable.id(sessionId)
    });
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark session as cancelled
router.put('/session/:timetableId/:sessionId/cancel', auth, async (req, res) => {
  try {
    const { timetableId, sessionId } = req.params;
    const { cancellationReason } = req.body;
    const teacherId = req.user.id;

    const timetable = await TimetableCell.findOne({
      _id: timetableId,
      'timetable._id': sessionId,
      'timetable.teacher': teacherId
    });

    if (!timetable) {
      return res.status(404).json({ 
        message: "Session not found or you are not the assigned teacher" 
      });
    }

    const session = timetable.timetable.id(sessionId);
    session.isCancelled = true;
    session.cancellationReason = cancellationReason;
    session.availableForBooking = true; // Make it available for other teachers
    session.updatedAt = new Date();

    await timetable.save();

    const updatedTimetable = await TimetableCell.findById(timetableId)
      .populate('timetable.subject')
      .populate('timetable.teacher')
      .populate('timetable.room');

    res.json({
      message: "Session marked as cancelled and available for booking",
      session: updatedTimetable.timetable.id(sessionId)
    });
  } catch (error) {
    console.error("Cancel session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Book available session
router.put('/session/:timetableId/:sessionId/book', auth, async (req, res) => {
  try {
    const { timetableId, sessionId } = req.params;
    const { bookingMessage } = req.body;
    const teacherId = req.user.id;

    const timetable = await TimetableCell.findOne({
      _id: timetableId,
      'timetable._id': sessionId,
      'timetable.availableForBooking': true,
      'timetable.isCancelled': true
    });

    if (!timetable) {
      return res.status(404).json({ 
        message: "Session not available for booking" 
      });
    }

    const session = timetable.timetable.id(sessionId);
    
    // Check if already booked
    if (session.bookedBy) {
      return res.status(400).json({ 
        message: "Session already booked by another teacher" 
      });
    }

    session.bookedBy = teacherId;
    session.bookingMessage = bookingMessage;
    session.availableForBooking = false;
    session.updatedAt = new Date();

    await timetable.save();

    const updatedTimetable = await TimetableCell.findById(timetableId)
      .populate('timetable.subject')
      .populate('timetable.teacher')
      .populate('timetable.bookedBy')
      .populate('timetable.room');

    res.json({
      message: "Session booked successfully",
      session: updatedTimetable.timetable.id(sessionId)
    });
  } catch (error) {
    console.error("Book session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get available sessions for booking
router.get('/available-sessions', auth, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    const availableSessions = await TimetableCell.find({
      'timetable.availableForBooking': true,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester: semester || 'Semester 1'
    })
    .populate('class')
    .populate('timetable.subject')
    .populate('timetable.teacher')
    .populate('timetable.room');

    const sessions = availableSessions.flatMap(timetable =>
      timetable.timetable
        .filter(session => session.availableForBooking && session.isCancelled)
        .map(session => ({
          ...session.toObject(),
          timetableId: timetable._id,
          className: timetable.class.name,
          classYear: timetable.class.year,
          classSection: timetable.class.section
        }))
    );

    res.json(sessions);
  } catch (error) {
    console.error("Get available sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to generate weekly calendar
function generateWeeklyCalendar(timetableSessions) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentWeek = getWeekDates(today);
  
  const calendar = currentWeek.map(date => {
    const dayName = days[date.getDay()];
    const daySessions = timetableSessions.filter(session => 
      session.day === dayName
    ).sort((a, b) => a.period - b.period);

    return {
      date: date.toISOString().split('T')[0],
      day: dayName,
      sessions: daySessions
    };
  });

  return calendar;
}

// Helper function to get current week dates
function getWeekDates(date) {
  const result = [];
  const current = new Date(date);
  // Start from Sunday
  current.setDate(current.getDate() - current.getDay());
  
  for (let i = 0; i < 7; i++) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}

module.exports = router;