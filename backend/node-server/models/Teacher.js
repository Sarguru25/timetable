const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
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
  position: {
    type: String,
    enum: ['HOD', 'Professor', 'Associate Professor', 'Assistant Professor'],
    required: true
  },
  subjectsCanTeach: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  unavailableSlots: [{
    day: Number,
    period: Number
  }],
  preferredSlots: [{
    day: Number,
    period: Number
  }],
  maxPeriodsPerWeek: {
    type: Number,
    default: 20,
    min: 1,
    max: 40
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Teacher', TeacherSchema);
