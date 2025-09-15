const express = require('express');
const Class = require('../models/Class.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Get all classes
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('subjects.subject')
      .populate('subjects.teacher');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single class
router.get('/:id', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('subjects.subject')
      .populate('subjects.teacher');

    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new class
router.post('/', auth, async (req, res) => {
  try {
    const { name, semester, subjects, studentCount, sharedStudents } = req.body;
    
    const classObj = new Class({
      name,
      semester,
      subjects,
      studentCount,
      sharedStudents
    });
    
    const savedClass = await classObj.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update class
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, semester, subjects, studentCount, sharedStudents } = req.body;
    
    const classObj = await Class.findByIdAndUpdate(
      req.params.id,
      { name, semester, subjects, studentCount, sharedStudents },
      { new: true, runValidators: true }
    )
    .populate('subjects.subject')
    .populate('subjects.teacher')
    // .populate('sharedStudents');
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classObj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete class
router.delete('/:id', auth, async (req, res) => {
  try {
    const classObj = await Class.findByIdAndDelete(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;