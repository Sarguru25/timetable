const express = require('express');
const TimetableCell = require('../models/TimetableCell.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Get timetable for a class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const timetable = await TimetableCell.find({ class: req.params.classId })
      .populate('subject')
      .populate('teacher')
      .populate('room')
      .populate('class');
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const timetable = await TimetableCell.find({ teacher: req.params.teacherId })
      .populate('subject')
      .populate('class')
      .populate('room');
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get timetable for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const timetable = await TimetableCell.find({ room: req.params.roomId })
      .populate('subject')
      .populate('teacher')
      .populate('class');
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manual slot filling by teacher
router.post('/manual', auth, async (req, res) => {
  try {
    const { classId, day, period, subjectId, teacherId, roomId } = req.body;
    
    // Check if slot is available
    const existingSlot = await TimetableCell.findOne({
      class: classId,
      day,
      period
    });
    
    if (existingSlot && existingSlot.locked) {
      return res.status(400).json({ message: 'Slot is already locked' });
    }
    
    // Check if teacher is available
    const teacherConflict = await TimetableCell.findOne({
      teacher: teacherId,
      day,
      period,
      locked: true
    });
    
    if (teacherConflict) {
      return res.status(400).json({ message: 'Teacher is not available at this slot' });
    }
    
    // Check if room is available
    const roomConflict = await TimetableCell.findOne({
      room: roomId,
      day,
      period,
      locked: true
    });
    
    if (roomConflict) {
      return res.status(400).json({ message: 'Room is not available at this slot' });
    }
    
    // Create or update the timetable cell
    const timetableCell = await TimetableCell.findOneAndUpdate(
      { class: classId, day, period },
      {
        subject: subjectId,
        teacher: teacherId,
        room: roomId,
        locked: true
      },
      { upsert: true, new: true }
    );
    
    res.json(timetableCell);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear timetable (admin only)
router.delete('/clear', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can clear the timetable' });
    }
    
    await TimetableCell.deleteMany({ locked: false });
    res.json({ message: 'Timetable cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /api/timetable/fixed-slots - Get all fixed timetable slots
router.get('/fixed-slots', async (req, res) => {
  try {
    const fixedSlots = await TimetableCell.find({ locked: true })
      .populate('subject')
      .populate('teacher')
      .populate('room')
      .populate('class');
    res.json(fixedSlots);
  } catch (error) {
    console.error('Error fetching fixed slots:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;