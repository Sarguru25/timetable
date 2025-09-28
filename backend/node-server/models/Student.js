const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  className: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
StudentSchema.index({ department: 1, semester: 1 });
StudentSchema.index({ rollNumber: 1 }, { unique: true });

// Safe export to prevent overwriting
module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);