  // backend/models/Class.js
  const mongoose = require("mongoose");

  const ClassSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
        hoursPerWeek: { type: Number, required: true, min: 1 }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  module.exports = mongoose.model("Class", ClassSchema);