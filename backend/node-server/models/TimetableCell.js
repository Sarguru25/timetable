const mongoose = require('mongoose');

const TimetableCellSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    unique: true // one timetable per class
  },
  timetable: [
    {
      day: {
        type: String,
        enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        required: true
      },
      period: { type: Number, required: true },
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
      room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
      locked: { type: Boolean, default: false }
    }
  ],
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimetableCell', TimetableCellSchema);
