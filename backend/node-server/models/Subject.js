const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  hoursPerWeek: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['theory', 'lab'],
    default: 'theory'
  },
  mandatory: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', SubjectSchema);