const express = require("express");
const Subject = require("../models/Subject.js");
const Class = require("../models/Class.js");
const auth = require("../middleware/auth.js");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const upload = multer({ dest: "uploads/" });


// Upload Excel and add subjects
// Expected columns in Excel:
//   name | type | hoursPerWeek | className

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const subjects = [];

    for (let row of data) {
      if (!row.name || !row.hoursPerWeek || !row.className) {
        return res.status(400).json({
          message: "Each row must have: name, hoursPerWeek, className",
          row,
        });
      }

      const foundClass = await Class.findOne({ name: row.className.trim() });
      if (!foundClass) {
        return res
          .status(400)
          .json({ message: `Class '${row.className}' not found` });
      }

      subjects.push({
        name: row.name.trim(),
        type: row.type?.toLowerCase() === "lab" ? "lab" : "theory",
        hoursPerWeek: Number(row.hoursPerWeek),
        classId: foundClass._id,
      });
    }

    const insertedSubjects = await Subject.insertMany(subjects);

    res.status(201).json({
      message: `✅ ${insertedSubjects.length} subjects uploaded successfully`,
      subjects: insertedSubjects,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ message: "Error uploading subjects", error: error.message });
  }
});
/**
 * Get all subjects with class info
 */
router.get("/", auth, async (req, res) => {
  try {
    const subjects = await Subject.find().populate("classId", "name semester");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get subject by ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate(
      "classId",
      "name semester"
    );
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create new subject
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, type, hoursPerWeek, classId } = req.body;

    if (!name || !type || !hoursPerWeek || !classId) {
      return res
        .status(400)
        .json({ message: "name, type, hoursPerWeek, classId are required" });
    }

    const foundClass = await Class.findById(classId);
    if (!foundClass) {
      return res.status(400).json({ message: "Class not found" });
    }

    const subject = new Subject({ name, type, hoursPerWeek, classId });
    const savedSubject = await subject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Update subject
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, type, hoursPerWeek, classId } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, type, hoursPerWeek, classId },
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Delete subject
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "✅ Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
