const express = require("express");
const Subject = require("../models/Subject.js");
const Class = require("../models/Class.js");
const Teacher = require("../models/Teacher.js");
const { auth, requireAdmin, requireHOD } = require("../middleware/auth.js");
const upload = require("../middleware/upload"); // your multer setup
const xlsx = require("xlsx");

const router = express.Router();

// Upload Excel and add subjects
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (!rows.length) return res.status(400).json({ message: "Excel file is empty" });

    let insertedCount = 0;
    for (const row of rows) {
      let { name, sCode, type, hoursPerWeek, className, teacherCode } = row;

      if (!name || sCode == null || !hoursPerWeek || !className || !teacherCode) continue;

      sCode = String(sCode).trim().toUpperCase();
      name = String(name).trim();
      teacherCode = String(teacherCode).trim().toUpperCase();
      className = String(className).trim();
      type = type?.toLowerCase() === "lab" ? "lab" : "theory";
      hoursPerWeek = Number(hoursPerWeek);

      const foundClass = await Class.findOne({ name: className });
      if (!foundClass) continue;

      const foundTeacher = await Teacher.findOne({ tCode: teacherCode });
      if (!foundTeacher) continue;

      const existing = await Subject.findOne({ sCode, classId: foundClass._id });
      if (existing) continue;

      const subject = new Subject({
        name,
        sCode,
        type,
        hoursPerWeek,
        classId: foundClass._id,
        teacherId: foundTeacher._id,
      });

      const savedSubject = await subject.save();

      foundClass.subjects.push({
        subject: savedSubject._id,
        teacher: foundTeacher._id,
        hoursPerWeek,
      });
      await foundClass.save();

      insertedCount++;
    }


    res.status(201).json({ message: `✅ ${insertedCount} subjects uploaded successfully` });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create subject
 */
// Create subject
router.post("/", auth, async (req, res) => {
  try {
    const { name, sCode, type, hoursPerWeek, classId, teacherCode, mandatory } = req.body;

    if (!name || !sCode || !hoursPerWeek || !classId || !teacherCode) {
      return res.status(400).json({ message: "name, sCode, hoursPerWeek, classId, teacherCode required" });
    }

    const foundClass = await Class.findById(classId);
    if (!foundClass) return res.status(400).json({ message: "Class not found" });

    const foundTeacher = await Teacher.findOne({ tCode: teacherCode.trim().toUpperCase() });
    if (!foundTeacher) return res.status(400).json({ message: "Teacher not found" });

    const existing = await Subject.findOne({ sCode: sCode.trim().toUpperCase(), classId: classId });
    if (existing) return res.status(400).json({ message: "Subject with this sCode already exists in the class" });

    const subject = new Subject({
      name: name.trim(),
      sCode: sCode.trim().toUpperCase(),
      type,
      mandatory,
      teacherId: foundTeacher._id,
      classId: foundClass._id,
      hoursPerWeek
    });

    const savedSubject = await subject.save();

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


// Update subject
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, hoursPerWeek, type, mandatory } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, hoursPerWeek, type, mandatory },
      { new: true, runValidators: true }
    );

    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const foundClass = await Class.findById(subject.classId);
    if (foundClass) {
      const subEntry = foundClass.subjects.find((s) => s.subject.toString() === subject._id.toString());
      if (subEntry) {
        subEntry.teacher = subject.teacherId;
        subEntry.hoursPerWeek = subject.hoursPerWeek;
      } else {
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

// Delete subject
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await Class.findByIdAndUpdate(subject.classId, {
      $pull: { subjects: { subject: subject._id } },
    });

    res.json({ message: "✅ Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;