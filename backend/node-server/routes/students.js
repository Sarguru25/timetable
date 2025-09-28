const express = require('express');
const { auth, requireAdmin, requireHOD } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const router = express.Router();

// Get all students (Admin and HOD of same department)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // HOD can only see students from their department
    if (req.user.role === 'hod') {
      filter.department = req.user.department;
    }

    const students = await Student.find(filter).sort({ rollNumber: 1 });

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// Create student (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, email, department, semester, rollNumber, className } = req.body;

    const student = new Student({
      name,
      email,
      department,
      semester,
      rollNumber,
      className
    });

    await student.save();
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student with this email or roll number already exists' });
    }
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error creating student' });
  }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if HOD is trying to access student from different department
    if (req.user.role === 'hod' && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
});

module.exports = router;