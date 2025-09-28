<<<<<<< Updated upstream
const express = require('express');
const Teacher = require('../models/Teacher.js');
const auth = require('../middleware/auth.js');
=======
const express = require("express");
const Teacher = require("../models/Teacher.js");
const { auth, requireAdmin, requireFaculty } = require("../middleware/auth.js");
const multer = require("multer");
const xlsx = require("xlsx");
>>>>>>> Stashed changes

const router = express.Router();

<<<<<<< Updated upstream
// Get all teachers
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjectsCanTeach').sort({ name: 1 });
    res.json(teachers);
=======
// =======================
// Bulk Upload Teachers (Admin only)
// =======================
router.post("/upload", auth, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const teachers = data.map((row) => ({
      name: row.Name,
      tCode: row.TCode,
      department: row.Department,
      gender: row.Gender,
      role: row.Role || "Faculty",
      contact: row.Contact,
      email: row.Email,
    }));

    const insertedTeachers = await Teacher.insertMany(teachers);
    res.status(201).json({
      message: "✅ Teachers uploaded successfully",
      teachers: insertedTeachers,
    });
>>>>>>> Stashed changes
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< Updated upstream
// Get teacher by ID
router.get('/:id', auth, async (req, res) => {
=======
// =======================
// Get all teachers (Public)
// =======================
router.get("/", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({ message: err.message });
  }
});

// =======================
// Get teacher by ID
// =======================
router.get("/:id", auth, async (req, res) => {
>>>>>>> Stashed changes
  try {
    const teacher = await Teacher.findById(req.params.id).populate('subjectsCanTeach');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({ message: error.message });
  }
});

<<<<<<< Updated upstream
// Create new teacher
router.post('/', auth, async (req, res) => {
=======
// =======================
// Create new teacher (Admin only)
// =======================
router.post("/", auth, requireAdmin, async (req, res) => {
>>>>>>> Stashed changes
  try {
    const { name, email, subjectsCanTeach, unavailableSlots, preferredSlots, maxHoursPerDay, maxHoursPerWeek, isHOD } = req.body;
    
    const teacher = new Teacher({
      name,
      email,
      subjectsCanTeach,
      unavailableSlots,
      preferredSlots,
      maxHoursPerDay,
      maxHoursPerWeek,
      isHOD
    });
    
    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(400).json({ message: error.message });
  }
});

<<<<<<< Updated upstream
// Update teacher
router.put('/:id', auth, async (req, res) => {
=======
// =======================
// Update teacher (Admin or Faculty)
// =======================
router.put("/:id", auth, requireAdmin, async (req, res) => {
>>>>>>> Stashed changes
  try {
    const { name, email, subjectsCanTeach, unavailableSlots, preferredSlots, maxHoursPerDay, maxHoursPerWeek, isHOD } = req.body;
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { name, email, subjectsCanTeach, unavailableSlots, preferredSlots, maxHoursPerDay, maxHoursPerWeek, isHOD },
      { new: true, runValidators: true }
    ).populate('subjectsCanTeach');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(400).json({ message: error.message });
  }
});

<<<<<<< Updated upstream
// Delete teacher
router.delete('/:id', auth, async (req, res) => {
=======
// =======================
// Delete teacher (Admin only)
// =======================
router.delete("/:id", auth, requireAdmin, async (req, res) => {
>>>>>>> Stashed changes
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;