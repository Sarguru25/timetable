const Class = require('../models/Class');

// GET /api/management/classes - Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('subjects.subject', 'name type')
      .populate('subjects.teacher', 'name email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/management/classes - Create a new class
router.post('/classes', async (req, res) => {
  try {
    console.log('Creating class with data:', req.body);
    
    const classItem = new Class(req.body);
    const savedClass = await classItem.save();
    
    // Populate the saved class with subject and teacher details
    await savedClass.populate([
      { path: 'subjects.subject', select: 'name type' },
      { path: 'subjects.teacher', select: 'name email' }
    ]);
    
    console.log('Class created successfully:', savedClass);
    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/management/classes/:id - Update a class
router.put('/classes/:id', async (req, res) => {
  try {
    console.log('Updating class:', req.params.id, 'with data:', req.body);
    
    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('subjects.subject', 'name type')
    .populate('subjects.teacher', 'name email');
    
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    console.log('Class updated successfully:', classItem);
    res.json(classItem);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/management/classes/:id - Delete a class
router.delete('/classes/:id', async (req, res) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/classes - Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('subjects.subject')
      .populate('subjects.teacher');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teachers - Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('subjectsCanTeach');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/subjects - Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/rooms - Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/timetable/fixed-slots - Get all fixed timetable slots
router.get('/timetable/fixed-slots', async (req, res) => {
  try {
    const fixedSlots = await TimetableCell.find({ locked: true })
      .populate('subject')
      .populate('teacher')
      .populate('room');
    res.json(fixedSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});