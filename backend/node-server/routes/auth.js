const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      teacherId: user.teacherId,
      studentId: user.studentId,
      department: user.department
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Test endpoint to check if auth is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// Test signup without auth for debugging
router.post('/test-signup', async (req, res) => {
  try {
    const { email, password, role, department, name } = req.body;

    console.log('Received signup data:', req.body);

    // Simple validation
    if (!email || !password || !role || !department || !name) {
      return res.status(400).json({
        message: 'All fields are required',
        received: req.body
      });
    }

    res.json({
      success: true,
      message: 'Test signup successful (no user created)',
      data: req.body
    });
  } catch (error) {
    console.error('Test signup error:', error);
    res.status(500).json({
      message: 'Test signup failed',
      error: error.message
    });
  }
});

// ================== ADMIN-ONLY USER CREATION ==================
router.post('/signup', auth, requireAdmin, async (req, res) => {
  try {
    const { email, password, role, department, name } = req.body;

    // Validation
    if (!email || !password || !role || !department) {
      return res.status(400).json({
        message: 'Email, password, role, and department are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    let teacherId = null;
    let studentId = null;

    // Create teacher profile for faculty roles
    if (['hod', 'assistant_professor', 'associate_professor', 'professor'].includes(role)) {
      // Generate unique teacher code
      const lastTeacher = await Teacher.findOne().sort({ createdAt: -1 });
      let nextNumber = 1;

      if (lastTeacher && lastTeacher.tCode) {
        const lastNum = parseInt(lastTeacher.tCode.replace("T-", "")) || 0;
        nextNumber = lastNum + 1;
      }

      const teacher = new Teacher({
        name,
        email,
        department,
        role:
          role === "hod"
            ? "HOD"
            : role === "assistant_professor"
              ? "Assistant Professor"
              : role === "associate_professor"
                ? "Associate Professor"
                : "Professor",
        tCode: `T-${String(nextNumber).padStart(3, "0")}`, // e.g. T-001, T-002
      });

      await teacher.save();
      teacherId = teacher._id;
    }


    // Create student profile for student role
    if (role === 'student') {
      const student = new Student({
        name,
        email,
        department
      });
      await student.save();
      studentId = student._id;
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      department,
      teacherId,
      studentId
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        teacherId: user.teacherId,
        studentId: user.studentId
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    console.error('Signup error details:', error.stack);
    res.status(500).json({
      message: 'Server error during user creation',
      error: error.message
    });
  }
});

// ================== LOGIN ==================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user and populate relevant data
    const user = await User.findOne({ email, isActive: true })
      .populate('teacherId')
      .populate('studentId');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Prepare user data for response
    let userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department
    };

    // Add name based on role
    if (user.teacherId) {
      userData.name = user.teacherId.name;
      userData.teacherId = user.teacherId._id;
    } else if (user.studentId) {
      userData.name = user.studentId.name;
      userData.studentId = user.studentId._id;
    } else {
      userData.name = 'Administrator';
    }

    res.json({
      token,
      user: userData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during authentication'
    });
  }
});

// ================== GET CURRENT USER ==================
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('teacherId')
      .populate('studentId');

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    let userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department
    };

    if (user.teacherId) {
      userData.name = user.teacherId.name;
      userData.teacherId = user.teacherId._id;
    } else if (user.studentId) {
      userData.name = user.studentId.name;
      userData.studentId = user.studentId._id;
    } else {
      userData.name = 'Administrator';
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

// ================== GET USERS (Admin only) ==================
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('teacherId')
      .populate('studentId');

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.teacherId?.name || user.studentId?.name || 'Administrator',
        isActive: user.isActive,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Server error fetching users"
    });
  }
});

module.exports = router;