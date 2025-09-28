const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 10
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  description: {
    type: String,
    trim: true
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
DepartmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Department', DepartmentSchema);