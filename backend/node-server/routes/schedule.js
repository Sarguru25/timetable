<<<<<<< Updated upstream
const express = require('express');
const axios = require('axios');
const TimetableCell = require('../models/TimetableCell.js');
const Class = require('../models/Class.js');
const Teacher = require('../models/Teacher.js');
const Subject = require('../models/Subject.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Trigger automatic scheduling
router.post('/generate', auth, async (req, res) => {
=======
// backend/routes/schedule.js
const express = require("express");
const axios = require("axios");
const TimetableCell = require("../models/TimetableCell.js");
const Class = require("../models/Class.js");
const Teacher = require("../models/Teacher.js");
const Subject = require("../models/Subject.js");
const { auth } = require("../middleware/auth.js");

const router = express.Router();

// Trigger automatic scheduling for selected classes
router.post("/generate", auth, async (req, res) => {
>>>>>>> Stashed changes
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can generate schedules' });
    }

<<<<<<< Updated upstream
    // Fetch data from MongoDB
    const classes = await Class.find().populate('subjects.subject').populate('subjects.teacher');
    const teachers = await Teacher.find().populate('subjectsCanTeach');
=======
    const { classIds } = req.body; // Array of class IDs to generate for

    // Validate input
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ message: "At least one class must be selected" });
    }

    // Fetch only selected classes from MongoDB
    const classes = await Class.find({ _id: { $in: classIds } })
      .populate("subjects.subject")
      .populate("subjects.teacher");

    // If fewer classes found than requested, warn but proceed
    if (classes.length !== classIds.length) {
      console.warn("Some requested classes not found:", classIds);
    }

    const teachers = await Teacher.find();
>>>>>>> Stashed changes
    const subjects = await Subject.find();
    // Fetch fixed slots only for selected classes
    const fixedSlots = await TimetableCell.find({
      locked: true,
      class: { $in: classIds }
    });

<<<<<<< Updated upstream
    // Prepare payload for Python
    const scheduleData = {
      classes: classes.map(c => ({
        id: c._id.toString(),
        name: c.name,
        subjects: c.subjects.map(s => ({
          subjectId: s.subject._id.toString(),
          subjectName: s.subject.name,
          teacherId: s.teacher._id.toString(),
          hoursPerWeek: s.hoursPerWeek
        })),
        studentCount: c.studentCount
=======
    // Prepare payload for Python (only selected classes)
    const scheduleData = {
      selectedClassIds: classIds, // Pass explicitly if Python needs it
      classes: classes.map(c => ({
        id: c._id.toString(),
        name: c.name,
        subjects: c.subjects
          .filter(s => s.subject && s.teacher) // ignore invalid entries
          .map(s => ({
            subjectId: s.subject._id.toString(),
            subjectName: s.subject.name,
            teacherId: s.teacher._id.toString(),
            hoursPerWeek: s.hoursPerWeek
          })),
        studentCount: c.studentCount || 0
>>>>>>> Stashed changes
      })),
      teachers: teachers.map(t => ({
        id: t._id.toString(),
        name: t.name,
<<<<<<< Updated upstream
        subjectsCanTeach: t.subjectsCanTeach.map(s => s._id.toString()),
        unavailableSlots: t.unavailableSlots,
        preferredSlots: t.preferredSlots,
        maxHoursPerDay: t.maxHoursPerDay,
        maxHoursPerWeek: t.maxHoursPerWeek,
        isHOD: t.isHOD
=======
        subjectsCanTeach: t.subjectsCanTeach ? t.subjectsCanTeach.map(s => s._id.toString()) : [],
        unavailableSlots: t.unavailableSlots || [],
        preferredSlots: t.preferredSlots || [],
        maxHoursPerDay: t.maxHoursPerDay || 3,  // CHANGED FROM 0 to 6
        maxHoursPerWeek: t.maxHoursPerWeek || 18, // CHANGED FROM 0 to 30
        isHOD: t.role === "HOD"
>>>>>>> Stashed changes
      })),
      subjects: subjects.map(s => ({
        id: s._id.toString(),
        name: s.name,
        type: s.type,
        hoursPerWeek: s.hoursPerWeek
      })),
      fixedSlots: fixedSlots.map(s => ({
        classId: s.class.toString(),
        day: s.day,
        period: s.period,
        subjectId: s.subject ? s.subject.toString() : null,
        teacherId: s.teacher ? s.teacher.toString() : null
      }))
    };

    console.log("Sending payload to Python for classes:", classIds, scheduleData);

    // Call Python service
<<<<<<< Updated upstream
    const response = await axios.post('http://localhost:8000/schedule', scheduleData);
=======
    const response = await axios.post(
      "http://localhost:8000/schedule",
      scheduleData
    );
>>>>>>> Stashed changes
    const { timetable, status, message } = response.data;

    if (status !== "success") {
      return res.status(400).json({ message: message || "Failed to generate schedule" });
    }

<<<<<<< Updated upstream
    // Save timetable into DB
    for (const cell of timetable) {
      await TimetableCell.findOneAndUpdate(
        { class: cell.classId, day: cell.day, period: cell.period },
        {
          subject: cell.subjectId,
          teacher: cell.teacherId,
          locked: false
        },
=======
    // Save timetable into DB, grouped by class
    for (const classId of classIds) {
      const classTimetable = timetable.filter(cell => cell.classId === classId);

      // Map day numbers to names if needed
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const formattedTimetable = classTimetable.map(cell => ({
        day: dayNames[cell.day - 1] || `${cell.day}`,
        period: cell.period,
        subject: cell.subjectId || null,
        teacher: cell.teacherId || null,
        locked: false
      }));

      await TimetableCell.findOneAndUpdate(
        { class: classId },
        { timetable: formattedTimetable },
>>>>>>> Stashed changes
        { upsert: true }
      );
    }

<<<<<<< Updated upstream
    // Send consistent response
    res.json({
      status: "success",
      message: "Schedule generated successfully",
      timetable
    });

    console.log("Generated timetable:", timetable);

=======
    // Clear any existing non-locked cells for these classes to avoid orphans
    await TimetableCell.deleteMany({
      class: { $in: classIds },
      locked: false
    });

    res.json({
      status: "success",
      message: `Schedule generated successfully for ${classes.length} classes`,
      timetable,
      selectedClasses: classes.map(c => ({ id: c._id.toString(), name: c.name }))
    });

    console.log("Generated timetable for classes:", classIds, timetable);
>>>>>>> Stashed changes
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
