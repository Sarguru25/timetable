const express = require('express');
const { auth, requireAdmin, requireHOD } = require('../middleware/auth');
const TimetableCell = require('../models/TimetableCell');
const Class = require('../models/Class');
const router = express.Router();
const mongoose = require("mongoose");

// Get all available classes that have timetables
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await TimetableCell.find({})
      .populate('class', 'name department')
      .distinct('class');

    const classDetails = await Class.find({
      _id: { $in: classes }
    }).select('name department');

    res.json({
      success: true,
      classes: classDetails
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
});

// Get timetable for a specific class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    // Role-based access control
    if (req.user.role === 'hod') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.department !== req.user.department) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const timetable = await TimetableCell.findOne({ class: classId })
      .populate('timetable.subject', 'name code')
      .populate('timetable.teacher', 'name email')
      .populate('timetable.room', 'name building')
      .populate('class', 'name semester department');

    if (!timetable) {
      return res.json({ success: true, timetable: [] });
    }

    res.json({
      success: true,
      timetable: timetable.timetable || []
    });
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({ message: 'Server error fetching timetable' });
  }
});

// Update timetable slot (Admin/HOD only)
router.put('/slot', auth, async (req, res) => {
  try {
    const { classId, day, period, updates } = req.body;

    // Check permissions
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // HOD can only edit their department's classes
    if (req.user.role === 'hod') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.department !== req.user.department) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const result = await TimetableCell.findOneAndUpdate(
      {
        class: classId,
        'timetable.day': day,
        'timetable.period': period
      },
      {
        $set: {
          'timetable.$.subject': updates.subject,
          'timetable.$.teacher': updates.teacher,
          'timetable.$.room': updates.room,
          'timetable.$.locked': updates.locked
        }
      },
      { new: true }
    ).populate('timetable.subject', 'name')
      .populate('timetable.teacher', 'name')
      .populate('timetable.room', 'name');

    res.json({
      success: true,
      message: 'Timetable slot updated successfully',
      updatedSlot: result ? result.timetable.find(slot =>
        slot.day === day && slot.period === period
      ) : null
    });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ message: 'Server error updating slot' });
  }
});

module.exports = router;