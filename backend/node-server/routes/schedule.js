// backend/routes/schedule.js
const express = require("express");
const axios = require("axios");
const TimetableCell = require("../models/TimetableCell.js");
const Class = require("../models/Class.js");
const Teacher = require("../models/Teacher.js");
const Subject = require("../models/Subject.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

// Trigger automatic scheduling
router.post("/generate", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can generate schedules" });
    }

    // Fetch data from MongoDB
    const classes = await Class.find()
      .populate("subjects.subject")
      .populate("subjects.teacher");
    const teachers = await Teacher.find();
    const subjects = await Subject.find();
    const fixedSlots = await TimetableCell.find({ locked: true });

    // ✅ Prepare payload for Python
const scheduleData = {
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
  })),
  teachers: teachers.map(t => ({
    id: t._id.toString(),
    name: t.name,
    subjectsCanTeach: t.subjectsCanTeach ? t.subjectsCanTeach.map(s => s._id.toString()) : [],
    unavailableSlots: t.unavailableSlots || [],
    preferredSlots: t.preferredSlots || [],
    maxHoursPerDay: t.maxHoursPerDay || 0,
    maxHoursPerWeek: t.maxHoursPerWeek || 0,
    isHOD: t.role === "HOD"
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

    console.log("Sending payload to Python:", scheduleData);

    // ✅ Call Python service
    const response = await axios.post(
      "http://localhost:8000/schedule",
      scheduleData
    );
    const { timetable, status, message } = response.data;

    if (status !== "success") {
      return res
        .status(400)
        .json({ message: message || "Failed to generate schedule" });
    }

    // ✅ Save timetable into DB
    for (const cell of timetable) {
      await TimetableCell.findOneAndUpdate(
        { class: cell.classId, day: cell.day, period: cell.period },
        {
          subject: cell.subjectId,
          teacher: cell.teacherId,
          locked: false,
        },
        { upsert: true }
      );
    }

    res.json({
      status: "success",
      message: "Schedule generated successfully",
      timetable,
    });

    console.log("Generated timetable:", timetable);
  } catch (error) {
    console.error("Schedule generation error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
