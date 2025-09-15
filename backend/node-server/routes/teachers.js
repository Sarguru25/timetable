const express = require('express');
const Teacher = require('../models/Teacher.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Get all teachers
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjectsCanTeach').sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get teacher by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('subjectsCanTeach');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new teacher
router.post('/', auth, async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
});

// Update teacher
router.put('/:id', auth, async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
});

// Delete teacher
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;