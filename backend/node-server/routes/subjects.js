const express = require('express');
const Subject = require('../models/Subject.js'); 
const auth = require('../middleware/auth.js');
const multer = require('multer');
const xlsx = require('xlsx');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // temporary folder for uploaded files

// Upload Excel and add subjects
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet);

    const subjects = await Subject.insertMany(
      data.map((row) => ({
        name: row.name,
        hoursPerWeek: row.hoursPerWeek,
        type: row.type || 'theory',
        mandatory: row.mandatory !== undefined ? row.mandatory : true,
      }))
    );

    res.status(201).json({ message: 'Subjects uploaded successfully', subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading subjects', error: error.message });
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

// Get subject by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new subject
router.post('/', auth, async (req, res) => {
  try {
    const { name, hoursPerWeek, type, mandatory } = req.body;
    
    const subject = new Subject({
      name,
      hoursPerWeek,
      type,
      mandatory
    });
    
    const savedSubject = await subject.save();
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
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
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
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;