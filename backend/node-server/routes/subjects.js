const express = require("express");
const Subject = require("../models/Subject.js");
const Class = require("../models/Class.js");
const Teacher = require("../models/Teacher.js");
const auth = require("../middleware/auth.js");
const multer = require("multer");
const xlsx = require("xlsx");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * Upload subjects via Excel
 * Excel format: name | sCode | type | hoursPerWeek | className | teacherCode
 */
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) return res.status(400).json({ message: "Excel file is empty" });

    const subjects = [];
    for (let row of data) {
      if (!row.name || !row.sCode || !row.hoursPerWeek || !row.className || !row.teacherCode) {
        return res.status(400).json({
          message: "Each row must have: name, sCode, hoursPerWeek, className, teacherCode",
          row,
        });
      }

      const foundClass = await Class.findOne({ name: row.className.trim() });
      if (!foundClass) return res.status(400).json({ message: `Class '${row.className}' not found` });

      const foundTeacher = await Teacher.findOne({ tCode: row.teacherCode.trim().toUpperCase() });
      if (!foundTeacher) return res.status(400).json({ message: `Teacher with tCode '${row.teacherCode}' not found` });

      subjects.push({
        name: row.name.trim(),
        sCode: row.sCode.trim().toUpperCase(),
        type: row.type?.toLowerCase() === "lab" ? "lab" : "theory",
        hoursPerWeek: Number(row.hoursPerWeek),
        classId: foundClass._id,
        teacherId: foundTeacher._id,
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
 * Get all subjects with class + teacher
 */
router.get("/", auth, async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate("classId", "name semester")
      .populate("teacherId", "name tCode");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/**
 * Create subject
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, sCode, type, hoursPerWeek, classId, teacherCode } = req.body;
    if (!name || !sCode || !hoursPerWeek || !classId || !teacherCode) {
      return res
        .status(400)
        .json({ message: "name, sCode, hoursPerWeek, classId, teacherCode required" });
    }

    const foundClass = await Class.findById(classId);
    if (!foundClass) return res.status(400).json({ message: "Class not found" });

    const foundTeacher = await Teacher.findOne({ tCode: teacherCode.trim().toUpperCase() });
    if (!foundTeacher) return res.status(400).json({ message: "Teacher not found" });

    // ✅ Create subject
    const subject = new Subject({
      name,
      sCode: sCode.trim().toUpperCase(),
      type,
      hoursPerWeek,
      classId,
      teacherId: foundTeacher._id,
    });
    const savedSubject = await subject.save();

    // ✅ Update Class model
    foundClass.subjects.push({
      subject: savedSubject._id,
      teacher: foundTeacher._id,
      hoursPerWeek,
    });
    await foundClass.save();

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
    const { name, sCode, type, hoursPerWeek, classId, teacherCode } = req.body;

    const foundTeacher = teacherCode
      ? await Teacher.findOne({ tCode: teacherCode.trim().toUpperCase() })
      : null;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        sCode: sCode?.trim().toUpperCase(),
        type,
        hoursPerWeek,
        classId,
        teacherId: foundTeacher ? foundTeacher._id : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // ✅ Sync Class model
    const foundClass = await Class.findById(subject.classId);
    if (foundClass) {
      const subEntry = foundClass.subjects.find(
        (s) => s.subject.toString() === subject._id.toString()
      );
      if (subEntry) {
        subEntry.teacher = subject.teacherId;
        subEntry.hoursPerWeek = subject.hoursPerWeek;
      } else {
        // if not already present, push
        foundClass.subjects.push({
          subject: subject._id,
          teacher: subject.teacherId,
          hoursPerWeek: subject.hoursPerWeek,
        });
      }
      await foundClass.save();
    }

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

    // ✅ Remove from Class model
    await Class.findByIdAndUpdate(subject.classId, {
      $pull: { subjects: { subject: subject._id } },
    });

    res.json({ message: "✅ Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
