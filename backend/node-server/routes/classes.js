// backend/routes/classes.js
const express = require("express");
const mongoose = require("mongoose");
const Class = require("../models/Class.js");
const Subject = require("../models/Subject.js");
const Teacher = require("../models/Teacher.js");
const auth = require("../middleware/auth.js");
const upload = require("../middleware/upload.js");
const xlsx = require("xlsx");

const router = express.Router();

/**
 * GET /api/classes
 * Get all classes (subjects + teacher populated)
 */
router.get("/", auth, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("subjects.subject", "name type hoursPerWeek")
      .populate("subjects.teacher", "name email position");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/classes
 * Create a class with an array of subjects.
 * Body:
 * {
 *   name: "Class 10A",
 *   subjects: [
 *     { subject: "<subjectId>" } OR { subjectName: "Math" },
 *     teacher: "<teacherId>" OR teacherEmail: "t@x.com", teacherName: "Mr X",
 *     hoursPerWeek: 3
 *   ]
 * }
 *
 * This endpoint will: create class, create any missing subject(s) linked to this class,
 * create any missing teacher(s) and link them.
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, subjects = [] } = req.body;
    if (!name) return res.status(400).json({ message: "Class name required" });

    // create class (if exists, return error)
    let cls = await Class.findOne({ name });
    if (cls) return res.status(400).json({ message: "Class already exists. Use update." });

    cls = new Class({ name, subjects: [] });
    await cls.save();

    // For each subject entry, ensure subject & teacher exist and push to class
    for (const row of subjects) {
      const hours = Number(row.hoursPerWeek) || 2;

      // Resolve / create subject
      let subjectDoc = null;
      if (row.subject && mongoose.Types.ObjectId.isValid(String(row.subject))) {
        subjectDoc = await Subject.findById(row.subject);
      } else if (row.subjectName || row.name) {
        const subjectName = row.subjectName || row.name;
        subjectDoc = await Subject.findOne({ name: subjectName, classId: cls._id });
        if (!subjectDoc) {
          subjectDoc = await Subject.create({
            name: subjectName,
            type: row.type || "theory",
            hoursPerWeek: hours,
            classId: cls._id
          });
        }
      } else {
        continue; // skip invalid row
      }

      // Resolve / create teacher
      let teacherDoc = null;
      if (row.teacher && mongoose.Types.ObjectId.isValid(String(row.teacher))) {
        teacherDoc = await Teacher.findById(row.teacher);
      } else if (row.teacherEmail) {
        teacherDoc = await Teacher.findOne({ email: row.teacherEmail.toLowerCase().trim() });
        if (!teacherDoc) {
          teacherDoc = await Teacher.create({
            name: row.teacherName || "Unknown",
            email: row.teacherEmail.toLowerCase().trim(),
            subjectsCanTeach: [subjectDoc._id]
          });
        } else {
          // ensure teacher has this subject in subjectsCanTeach
          if (!teacherDoc.subjectsCanTeach.some(sid => sid.toString() === subjectDoc._id.toString())) {
            teacherDoc.subjectsCanTeach.push(subjectDoc._id);
            await teacherDoc.save();
          }
        }
      } else {
        // fallback: choose any teacher that can teach this subject, or skip
        teacherDoc = await Teacher.findOne({ subjectsCanTeach: subjectDoc._id });
      }

      // push to class if not already present
      const exists = cls.subjects.some(s => s.subject.toString() === subjectDoc._id.toString());
      if (!exists && teacherDoc) {
        cls.subjects.push({ subject: subjectDoc._id, teacher: teacherDoc._id, hoursPerWeek: hours });
        await cls.save();
      }
    }

    const populated = await Class.findById(cls._id)
      .populate("subjects.subject", "name type hoursPerWeek")
      .populate("subjects.teacher", "name email position");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/classes/:id
 * Update class name or replace subjects array.
 * Accepts: { name, subjects: [{ subject (id or name), teacher (id or email), hoursPerWeek }] }
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const { name, subjects = null } = req.body;
    if (name) cls.name = name;

    if (Array.isArray(subjects)) {
      // Clear existing subjects and rebuild
      cls.subjects = [];
      await cls.save();

      for (const row of subjects) {
        const hours = Number(row.hoursPerWeek) || 2;

        // Resolve/create subject
        let subjectDoc = null;
        if (row.subject && mongoose.Types.ObjectId.isValid(String(row.subject))) {
          subjectDoc = await Subject.findById(row.subject);
        } else if (row.subjectName || row.name) {
          const subjectName = row.subjectName || row.name;
          subjectDoc = await Subject.findOne({ name: subjectName, classId: cls._id });
          if (!subjectDoc) {
            subjectDoc = await Subject.create({
              name: subjectName,
              type: row.type || "theory",
              hoursPerWeek: hours,
              classId: cls._id
            });
          }
        } else {
          continue;
        }

        // Resolve/create teacher
        let teacherDoc = null;
        if (row.teacher && mongoose.Types.ObjectId.isValid(String(row.teacher))) {
          teacherDoc = await Teacher.findById(row.teacher);
        } else if (row.teacherEmail) {
          teacherDoc = await Teacher.findOne({ email: row.teacherEmail.toLowerCase().trim() });
          if (!teacherDoc) {
            teacherDoc = await Teacher.create({
              name: row.teacherName || "Unknown",
              email: row.teacherEmail.toLowerCase().trim(),
              subjectsCanTeach: [subjectDoc._id]
            });
          } else if (!teacherDoc.subjectsCanTeach.some(sid => sid.toString() === subjectDoc._id.toString())) {
            teacherDoc.subjectsCanTeach.push(subjectDoc._id);
            await teacherDoc.save();
          }
        } else {
          teacherDoc = await Teacher.findOne({ subjectsCanTeach: subjectDoc._id });
        }

        if (subjectDoc && teacherDoc) {
          cls.subjects.push({ subject: subjectDoc._id, teacher: teacherDoc._id, hoursPerWeek: hours });
          await cls.save();
        }
      }
    }

    await cls.save();

    const populated = await Class.findById(cls._id)
      .populate("subjects.subject", "name type hoursPerWeek")
      .populate("subjects.teacher", "name email position");

    res.json(populated);
  } catch (error) {
    console.error("Update class error:", error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/classes/:id
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/classes/upload
 * Excel upload (file form-data field: 'file')
 * Expected headers in sheet (case-insensitive):
 *  className | subjectName | subjectType | hoursPerWeek | teacherName | teacherEmail | position
 */
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const results = [];

    for (const row of data) {
      // Accept both 'subjectName' or 'name' from old sheets
      const className = row.className || row.ClassName || row.class || row.Class;
      const subjectName = row.subjectName || row.name || row.Subject || row.SubjectName;
      const type = row.subjectType || row.type || row.Type || 'theory';
      const hoursPerWeek = Number(row.hoursPerWeek || row.Hours || 2);
      const teacherEmail = (row.teacherEmail || row.TeacherEmail || row.email || row.Email || "").toLowerCase().trim();
      const teacherName = row.teacherName || row.Teacher || row.TeacherName || "Unknown";
      const position = row.position || row.Position || undefined;

      if (!className || !subjectName) {
        results.push({ error: "Missing className or subjectName", row });
        continue;
      }

      // Create/find class
      let cls = await Class.findOne({ name: className });
      if (!cls) cls = await Class.create({ name: className, subjects: [] });

      // Create/find subject
      let subject = await Subject.findOne({ name: subjectName, classId: cls._id });
      if (!subject) {
        subject = await Subject.create({
          name: subjectName,
          type,
          hoursPerWeek,
          classId: cls._id
        });
      }

      // Create/find teacher
      let teacher = null;
      if (teacherEmail) {
        teacher = await Teacher.findOne({ email: teacherEmail });
        if (!teacher) {
          teacher = await Teacher.create({
            name: teacherName,
            email: teacherEmail,
            position,
            subjectsCanTeach: [subject._id]
          });
        } else if (!teacher.subjectsCanTeach.some(s => s.toString() === subject._id.toString())) {
          teacher.subjectsCanTeach.push(subject._id);
          await teacher.save();
        }
      } else {
        // fallback: any teacher who can teach the subject
        teacher = await Teacher.findOne({ subjectsCanTeach: subject._id });
      }

      // Link to class
      const exists = cls.subjects.some(s => s.subject.toString() === subject._id.toString());
      if (!exists && teacher) {
        cls.subjects.push({ subject: subject._id, teacher: teacher._id, hoursPerWeek });
        await cls.save();
      }

      results.push({ class: cls.name, subject: subject.name, teacher: teacher ? teacher.email : null });
    }

    res.status(201).json({ message: "Excel processed", results });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
