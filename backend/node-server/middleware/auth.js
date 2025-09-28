const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or account inactive' });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId,
      studentId: user.studentId,
      department: user.department
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }

    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Specific role middlewares
const requireAdmin = requireRole(['admin']);
const requireHOD = requireRole(['hod']);
const requireFaculty = requireRole(['assistant_professor', 'associate_professor', 'professor']);
const requireStudent = requireRole(['student']);
const requireFacultyOrStudent = requireRole(['assistant_professor', 'associate_professor', 'professor', 'student']);

module.exports = {
  auth,
  requireRole,
  requireAdmin,
  requireHOD,
  requireFaculty,
  requireStudent,
  requireFacultyOrStudent
};