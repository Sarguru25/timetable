const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    hoursPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  }],
  studentCount: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for better performance and uniqueness
ClassSchema.index({ name: 1, year: 1, section: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Class', ClassSchema);