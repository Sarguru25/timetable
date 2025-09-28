const express = require("express");
const Subject = require("../models/Subject.js");
const Class = require("../models/Class.js");
const Teacher = require("../models/Teacher.js");
const { auth } = require("../middleware/auth.js");
const upload = require("../middleware/upload");
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
      let { name, sCode, type, hoursPerWeek, className, year, section, semester, teacherCode } = row;

      if (!name || sCode == null || !hoursPerWeek || !className || !year || !section || !semester || !teacherCode) continue;

      sCode = String(sCode).trim().toUpperCase();
      name = String(name).trim();
      teacherCode = String(teacherCode).trim().toUpperCase();
      className = String(className).trim();
      section = String(section).trim().toUpperCase();
      semester = String(semester).trim();
      type = type?.toLowerCase() === "lab" ? "lab" : "theory";
      hoursPerWeek = Number(hoursPerWeek);
      year = Number(year);

      // Find or create class
      let foundClass = await Class.findOne({ 
        name: className, 
        year: year, 
        section: section,
        semester: semester
      });

      if (!foundClass) {
        // Create new class if it doesn't exist
        foundClass = new Class({
          name: className,
          year: year,
          section: section,
          semester: semester,
          studentCount: 30, // Default value
          subjects: []
        });
        await foundClass.save();
      }

      const foundTeacher = await Teacher.findOne({ tCode: teacherCode });
      if (!foundTeacher) {
        console.log(`Teacher not found: ${teacherCode}`);
        continue;
      }

      const existingSubject = await Subject.findOne({ sCode, classId: foundClass._id });
      if (existingSubject) {
        console.log(`Subject already exists: ${sCode} in class ${foundClass._id}`);
        continue;
      }

      // Create subject
      const subject = new Subject({
        name,
        sCode,
        type,
        hoursPerWeek,
        classId: foundClass._id,
        teacherId: foundTeacher._id,
      });

      const savedSubject = await subject.save();

      // Add subject to class
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
router.get("/", auth, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Server error while fetching subjects" });
  }
});

// Create subject
router.post("/", auth, async (req, res) => {
    console.log("Incoming data:", req.body);
  try {
    const { 
      name, 
      sCode, 
      type, 
      hoursPerWeek, 
      classId, 
      teacherCode,
      // Class fields
      className,
      year,
      section,
      semester,
      studentCount
    } = req.body;

    // Validate subject fields
    if (!name || !sCode || !hoursPerWeek || !teacherCode) {
      return res.status(400).json({ message: "Subject name, code, hours per week, and teacher are required" });
    }

    let foundClass;
    
    // If classId is provided, use existing class
    if (classId) {
      foundClass = await Class.findById(classId);
      if (!foundClass) {
        return res.status(400).json({ message: "Class not found" });
      }
    } 
    // Otherwise, create new class with provided details
    else if (className && year && section && semester) {
      // Check if class already exists
      const existingClass = await Class.findOne({
        name: className,
        year: year,
        section: section,
        semester: semester
      });

      if (existingClass) {
        foundClass = existingClass;
      } else {
        // Create new class
        foundClass = new Class({
          name: className,
          year: year,
          section: section,
          semester: semester,
          studentCount: studentCount || 30,
          subjects: []
        });
        await foundClass.save();
      }
    } else {
      return res.status(400).json({ message: "Either select existing class or provide class details" });
    }

    // Find teacher
    const foundTeacher = await Teacher.findOne({ tCode: teacherCode.trim().toUpperCase() });
    if (!foundTeacher) {
      return res.status(400).json({ message: "Teacher not found" });
    }

    // Check if subject already exists in this class
    const existingSubject = await Subject.findOne({ 
      sCode: sCode.trim().toUpperCase(), 
      classId: foundClass._id 
    });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject with this code already exists in the class" });
    }

    // Create subject
    const subject = new Subject({
      name: name.trim(),
      sCode: sCode.trim().toUpperCase(),
      type: type || "theory",
      hoursPerWeek: Number(hoursPerWeek),
      classId: foundClass._id,
      teacherId: foundTeacher._id,
    });

    const savedSubject = await subject.save();

    // Add subject to class
    foundClass.subjects.push({
      subject: savedSubject._id,
      teacher: foundTeacher._id,
      hoursPerWeek: Number(hoursPerWeek),
    });
    await foundClass.save();

    // Populate and return
    const populatedSubject = await Subject.findById(savedSubject._id)
      .populate('classId')
      .populate('teacherId');

    res.status(201).json(populatedSubject);
  } catch (error) {
    console.error("Create subject error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update subject
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, hoursPerWeek, type, teacherCode } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // If teacher is being updated
    if (teacherCode) {
      const foundTeacher = await Teacher.findOne({ tCode: teacherCode.trim().toUpperCase() });
      if (!foundTeacher) return res.status(400).json({ message: "Teacher not found" });
      subject.teacherId = foundTeacher._id;
    }

    subject.name = name || subject.name;
    subject.hoursPerWeek = hoursPerWeek || subject.hoursPerWeek;
    subject.type = type || subject.type;

    const updatedSubject = await subject.save();

    // Update class subjects array
    const foundClass = await Class.findById(subject.classId);
    if (foundClass) {
      const subjectEntry = foundClass.subjects.find(s => 
        s.subject.toString() === subject._id.toString()
      );
      if (subjectEntry) {
        subjectEntry.teacher = updatedSubject.teacherId;
        subjectEntry.hoursPerWeek = updatedSubject.hoursPerWeek;
        await foundClass.save();
      }
    }

    const populatedSubject = await Subject.findById(updatedSubject._id)
      .populate('classId')
      .populate('teacherId');

    res.json(populatedSubject);
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete subject
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Remove from class first
    await Class.findByIdAndUpdate(subject.classId, {
      $pull: { subjects: { subject: subject._id } },
    });

    // Then delete subject
    await Subject.findByIdAndDelete(req.params.id);

    res.json({ message: "✅ Subject deleted successfully" });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;