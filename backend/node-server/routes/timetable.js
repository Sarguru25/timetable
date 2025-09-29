const express = require('express');
const { auth } = require('../middleware/auth');
const TimetableCell = require('../models/TimetableCell');
const Class = require('../models/Class');
const mongoose = require("mongoose");

const router = express.Router();

/**
 * GET /api/timetable/classes
 * Get all classes that have timetables
 */
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await TimetableCell.find({})
      .populate('class', 'name department')
      .distinct('class');

    const classDetails = await Class.find({ _id: { $in: classes } })
      .select('name department semester');

    res.json({ success: true, classes: classDetails });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
});

/**
 * GET /api/timetable/class/:classId
 * Get timetable for a specific class
 * Optional: ?day=Monday
 */
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { day } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    // HOD role restriction (can only access their own department's classes)
    if (req.user.role === 'hod') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const timetableDoc = await TimetableCell.findOne({ class: classId })
      .populate('timetable.subject', 'name code')
      .populate('timetable.teacher', 'name email')
      .populate('timetable.room', 'name building')
      .populate('class', 'name semester department');

    if (!timetableDoc) {
      return res.json({ success: true, timetable: [] });
    }

    let slots = timetableDoc.timetable || [];
    if (day) {
      slots = slots.filter(slot => slot.day === day);
    }

    res.json({ success: true, timetable: slots });
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({ message: 'Server error fetching timetable' });
  }
});

/**
 * PUT /api/timetable/slot
 * Update a timetable slot (Admin/HOD only)
 * Body: { classId, day, period, updates }
 */
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
      if (!classDoc || classDoc.department.toString() !== req.user.department.toString()) {
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
    )
      .populate('timetable.subject', 'name')
      .populate('timetable.teacher', 'name')
      .populate('timetable.room', 'name');

    res.json({
      success: true,
      message: 'Timetable slot updated successfully',
      updatedSlot: result
        ? result.timetable.find(slot => slot.day === day && slot.period === period)
        : null
    });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ message: 'Server error updating slot' });
  }
});

/**
 * PUT /api/timetable/slot/description
 * Update description for a timetable slot (HOD/Faculty only)
 * Body: { classId, day, period, description }
 */
router.put('/slot/description', auth, async (req, res) => {
  try {
    const { classId, day, period, description } = req.body;

    // Check permissions - only HOD and Faculty can update descriptions
    if (!['hod', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // HOD can only edit their department's classes
    if (req.user.role === 'hod') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Faculty can only edit their own slots
    if (req.user.role === 'faculty') {
      const timetableDoc = await TimetableCell.findOne({
        class: classId,
        'timetable.day': day,
        'timetable.period': period
      });
      
      if (!timetableDoc) {
        return res.status(404).json({ message: 'Timetable slot not found' });
      }

      const slot = timetableDoc.timetable.find(s => 
        s.day === day && s.period === period
      );

      if (!slot || slot.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only edit your own slots' });
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
          'timetable.$.description': description
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    const updatedSlot = result.timetable.find(slot => 
      slot.day === day && slot.period === period
    );

    res.json({
      success: true,
      message: 'Description updated successfully',
      updatedSlot: updatedSlot
    });
  } catch (error) {
    console.error('Update description error:', error);
    res.status(500).json({ message: 'Server error updating description' });
  }
});

module.exports = router;