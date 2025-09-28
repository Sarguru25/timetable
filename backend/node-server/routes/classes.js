const express = require("express");
const Class = require("../models/Class.js");
const Subject = require("../models/Subject.js");
const Teacher = require("../models/Teacher.js");
const { auth } = require("../middleware/auth.js");
const xlsx = require("xlsx");
const multer = require("multer");
const router = express.Router();

// =================== GET ALL CLASSES ===================
router.get("/", auth, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("subjects.subject")
      .populate("subjects.teacher")
      .sort({ name: 1, year: 1, section: 1 });
    res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== GET SINGLE CLASS ===================
router.get("/:id", auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate("subjects.subject")
      .populate("subjects.teacher");

    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(classObj);
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =================== CREATE NEW CLASS ===================
router.post("/", auth, async (req, res) => {
  try {
    const { name, year, section, semester, subjects, studentCount } = req.body;

    // Check if class already exists
    const existingClass = await Class.findOne({
      name,
      year,
      section,
      semester
    });

    if (existingClass) {
      return res.status(400).json({ 
        message: "Class with same name, year, section and semester already exists" 
      });
    }

    const classObj = new Class({
      name,
      year,
      section,
      semester,
      subjects,
      studentCount,
    });

    const savedClass = await classObj.save();
    // Populate the saved class
    const populatedClass = await Class.findById(savedClass._id)
      .populate("subjects.subject")
      .populate("subjects.teacher");
    
    res.status(201).json(populatedClass);
  } catch (error) {
    console.error("Create class error:", error);
    res.status(400).json({ message: error.message });
  }
});

// =================== UPDATE CLASS ===================
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, year, section, semester, subjects, studentCount } = req.body;

    const classObj = await Class.findByIdAndUpdate(
      req.params.id,
      { name, year, section, semester, subjects, studentCount },
      { new: true, runValidators: true }
    )
      .populate("subjects.subject")
      .populate("subjects.teacher");

    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classObj);
  } catch (error) {
    console.error("Update class error:", error);
    res.status(400).json({ message: error.message });
  }
});

// =================== DELETE CLASS ===================
router.delete("/:id", auth, async (req, res) => {
  try {
    const classObj = await Class.findByIdAndDelete(req.params.id);

    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ message: error.message });
  }
});

// =================== BULK UPLOAD (Excel) ===================
const upload = multer({ storage: multer.memoryStorage() });

router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ error: "Empty Excel file" });
    }

    // Expected Excel Headers: Class Name | Year | Section | Semester | Student Count
    const classes = data.map((row) => ({
      name: row["Class Name"] || "Unnamed Class",
      year: row["Year"] || 1,
      section: String(row["Section"] || "A").toUpperCase(),
      semester: row["Semester"] || "Semester 1",
      studentCount: row["Student Count"] || 30,
      subjects: []
    }));

    // Save all classes
    await Class.insertMany(classes);

    res.json({
      message: "✅ Bulk upload successful",
      count: classes.length,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;