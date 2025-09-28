const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const multer = require('multer');
const xlsx = require('xlsx');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Get all users (Admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('teacherId')
      .populate('studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.teacherId?.name || user.studentId?.name || 'Administrator',
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Create single user (Admin only)
router.post('/create', auth, requireAdmin, async (req, res) => {
  try {
      console.log('Incoming body:', req.body); 
    const { userType, userData } = req.body;

    if (!userType || !userData) {
      return res.status(400).json({ message: 'User type and data are required' });
    }

    let newUser;
    let associatedRecord;

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (userType === 'student') {
      // Check if rollNumber already exists
      const existingStudent = await Student.findOne({ rollNumber: userData.rollNumber });
      if (existingStudent) {
        return res.status(400).json({ message: 'Roll number already exists' });
      }

      // Create student record
      associatedRecord = new Student({
        name: userData.name,
        email: userData.email.toLowerCase(),
        department: userData.department,
        semester: userData.semester,
        rollNumber: userData.rollNumber,
        className: userData.className
      });
      await associatedRecord.save();

      // Create user record
      newUser = new User({
        email: userData.email.toLowerCase(),
        password: userData.password || 'default123',
        role: 'student',
        studentId: associatedRecord._id,
        department: userData.department
      });

    } else if (['assistant_professor', 'associate_professor', 'professor', 'hod'].includes(userType)) {
      // Check if teacher code already exists
      const existingTeacher = await Teacher.findOne({ tCode: userData.tCode });
      if (existingTeacher) {
        return res.status(400).json({ message: 'Teacher code already exists' });
      }

      // Create teacher record
      associatedRecord = new Teacher({
        name: userData.name,
        tCode: userData.tCode,
        department: userData.department,
        gender: userData.gender,
        role: userData.teacherRole,
        contact: userData.contact,
        email: userData.email.toLowerCase(),
        unavailableSlots: userData.unavailableSlots || [],
        preferredSlots: userData.preferredSlots || []
      });
      await associatedRecord.save();

      // Create user record
      newUser = new User({
        email: userData.email.toLowerCase(),
        password: userData.password || 'default123',
        role: userType,
        teacherId: associatedRecord._id,
        department: userData.department
      });
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    await newUser.save();

    // Populate the response
    const populatedUser = await User.findById(newUser._id)
      .select('-password')
      .populate('teacherId')
      .populate('studentId');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: populatedUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field value entered' });
    }
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Bulk create students from Excel
router.post('/bulk/students', auth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      successful: [],
      errors: []
    };

    for (const [index, row] of data.entries()) {
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.department || !row.semester || !row.rollNumber || !row.className) {
          results.errors.push(`Row ${index + 2}: Missing required fields`);
          continue;
        }

        // Check if email exists
        const existingUser = await User.findOne({ email: row.email.toLowerCase() });
        if (existingUser) {
          results.errors.push(`Row ${index + 2}: Email ${row.email} already exists`);
          continue;
        }

        // Check if rollNumber exists
        const existingStudent = await Student.findOne({ rollNumber: row.rollNumber });
        if (existingStudent) {
          results.errors.push(`Row ${index + 2}: Roll number ${row.rollNumber} already exists`);
          continue;
        }

        // Create student record
        const student = new Student({
          name: row.name,
          email: row.email.toLowerCase(),
          department: row.department,
          semester: parseInt(row.semester),
          rollNumber: row.rollNumber,
          className: row.className
        });
        await student.save();

        // Create user record
        const user = new User({
          email: row.email.toLowerCase(),
          password: 'default123',
          role: 'student',
          studentId: student._id,
          department: row.department
        });
        await user.save();

        results.successful.push(`Row ${index + 2}: ${row.name} created successfully`);

      } catch (error) {
        results.errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. Successful: ${results.successful.length}, Errors: ${results.errors.length}`,
      results
    });

  } catch (error) {
    console.error('Bulk student upload error:', error);
    res.status(500).json({ message: 'Server error processing bulk upload' });
  }
});

// Bulk create teachers from Excel
router.post('/bulk/teachers', auth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      successful: [],
      errors: []
    };

    for (const [index, row] of data.entries()) {
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.department || !row.tCode || !row.teacherRole) {
          results.errors.push(`Row ${index + 2}: Missing required fields`);
          continue;
        }

        // Check if email exists
        const existingUser = await User.findOne({ email: row.email.toLowerCase() });
        if (existingUser) {
          results.errors.push(`Row ${index + 2}: Email ${row.email} already exists`);
          continue;
        }

        // Check if teacher code exists
        const existingTeacher = await Teacher.findOne({ tCode: row.tCode });
        if (existingTeacher) {
          results.errors.push(`Row ${index + 2}: Teacher code ${row.tCode} already exists`);
          continue;
        }

        // Create teacher record
        const teacher = new Teacher({
          name: row.name,
          tCode: row.tCode,
          department: row.department,
          gender: row.gender || 'Other',
          role: row.teacherRole,
          contact: row.contact || '',
          email: row.email.toLowerCase()
        });
        await teacher.save();

        // Create user record
        const userRole = row.teacherRole.toLowerCase().replace(' ', '_');
        const user = new User({
          email: row.email.toLowerCase(),
          password: 'default123',
          role: userRole,
          teacherId: teacher._id,
          department: row.department
        });
        await user.save();

        results.successful.push(`Row ${index + 2}: ${row.name} created successfully`);

      } catch (error) {
        results.errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. Successful: ${results.successful.length}, Errors: ${results.errors.length}`,
      results
    });

  } catch (error) {
    console.error('Bulk teacher upload error:', error);
    res.status(500).json({ message: 'Server error processing bulk upload' });
  }
});

// Update user status (Admin only)
router.patch('/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated record
    if (user.studentId) {
      await Student.findByIdAndDelete(user.studentId);
    } else if (user.teacherId) {
      await Teacher.findByIdAndDelete(user.teacherId);
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;