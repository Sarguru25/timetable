// backend/node-server/scripts/seedData.js
require('dotenv').config(); // ✅ Load environment variables

const mongoose = require('mongoose');
const Teacher = require('../models/Teacher.js');
const Class = require('../models/Class.js');
const Subject = require('../models/Subject.js');

const seedData = async () => {
  try {
    // ✅ Connect to MongoDB using .env
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected for seeding...");

    // Clear existing data
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});

    // Add sample subjects
    const subjects = await Subject.insertMany([
      { name: 'Mathematics', type: 'theory', hoursPerWeek: 4 },
      { name: 'Physics', type: 'theory', hoursPerWeek: 3 },
      { name: 'Physics Lab', type: 'lab', hoursPerWeek: 2 },
      { name: 'Chemistry', type: 'theory', hoursPerWeek: 3 },
      { name: 'Chemistry Lab', type: 'lab', hoursPerWeek: 2 },
    ]);

    // Add sample teachers
    const teachers = await Teacher.insertMany([
      {
        name: 'Dr. Smith',
        email: 'smith@college.edu',
        subjectsCanTeach: [subjects[0]._id, subjects[1]._id],
        maxHoursPerDay: 4,
        maxHoursPerWeek: 20,
      },
      {
        name: 'Prof. Johnson',
        email: 'johnson@college.edu',
        subjectsCanTeach: [subjects[2]._id, subjects[3]._id, subjects[4]._id],
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
      },
    ]);

    // Add sample classes
    await Class.insertMany([
      {
        name: 'Class 10A',
        semester: 'Spring 2023',
        subjects: [
          { subject: subjects[0]._id, teacher: teachers[0]._id, hoursPerWeek: 4 },
          { subject: subjects[1]._id, teacher: teachers[0]._id, hoursPerWeek: 3 },
          { subject: subjects[2]._id, teacher: teachers[1]._id, hoursPerWeek: 2 },
        ],
        studentCount: 30,
      },
    ]);

    console.log("🎉 Sample data added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
