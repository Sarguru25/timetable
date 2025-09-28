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
  maxHoursPerDay: {
    type: Number,
    default: 4,
    min: 1,
    max: 8
  },
  maxHoursPerWeek: {
    type: Number,
    default: 20,
    min: 1,
    max: 40
  },
  isHOD: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Teacher", TeacherSchema);
