const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Teacher = require('../models/Teacher.js');
const auth = require('../middleware/auth');

const router = express.Router();

// Allowed roles
const ALLOWED_ROLES = ['teacher', 'admin', 'student'];

// Utility: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      teacherId: user.teacherId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ================== SIGNUP ==================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validations
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Teacher profile if role is teacher
    let teacherId = null;
    if (role === 'teacher') {
      const teacher = await new Teacher({
        name,
        email,
        subjectsCanTeach: [],
        unavailableSlots: [],
        preferredSlots: [],
        maxHoursPerDay: 4,
        maxHoursPerWeek: 20,
        isHOD: false,
      }).save();

      teacherId = teacher._id;
    }

    // Create User
    const user = await new User({
      name,
      email,
      password: hashedPassword,
      role,
      teacherId,
      firstLogin: true,
    }).save();

    // Generate JWT
    const token = generateToken(user);

    // Response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        teacherId: user.teacherId,
        firstLogin: user.firstLogin,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ================== LOGIN ==================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).populate('teacherId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken({
      _id: user._id,
      role: user.role,
      teacherId: user.teacherId ? user.teacherId._id : null,
    });

    // Response
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.teacherId ? user.teacherId.name : user.name || 'Administrator',
        role: user.role,
        teacherId: user.teacherId ? user.teacherId._id : null,
        firstLogin: user.firstLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});


// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password').populate('teacherId');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        teacherId: user.teacherId ? user.teacherId._id : null,
        firstLogin: user.firstLogin
      }
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
