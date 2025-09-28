const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', SubjectSchema);
