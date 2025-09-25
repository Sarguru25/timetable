const express = require("express");
const Teacher = require("../models/Teacher.js");
const auth = require("../middleware/auth.js");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * Bulk Upload Teachers from Excel
 * Expected Columns: Name, TCode, Department, Gender, Role, Contact, Email
 */
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const teachers = data.map((row) => ({
      name: row.Name,
      tCode: row.TCode,
      department: row.Department,
      gender: row.Gender,
      role: row.Role || "Faculty",
      contact: row.Contact,
      email: row.Email,
    }));

    await Teacher.insertMany(teachers);
    res.json({ message: "✅ Teachers uploaded successfully", teachers });
  } catch (error) {
    console.error("❌ Error uploading teachers:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all teachers
router.get("/", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get teacher by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new teacher
router.post("/", auth, async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update teacher
router.put("/:id", auth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete teacher
router.delete("/:id", auth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
