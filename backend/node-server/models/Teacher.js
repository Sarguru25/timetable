const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    role: {
      type: String,
      enum: ["Assistant Professor", "Associate Professor", "Professor","HOD"],
      default: "Faculty",
    },
    contact: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    unavailableSlots: [
      {
        day: { type: Number, min: 1, max: 7 },
        period: { type: Number, min: 1 },
      },
    ],
    preferredSlots: [
      {
        day: { type: Number, min: 1, max: 7 },
        period: { type: Number, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);