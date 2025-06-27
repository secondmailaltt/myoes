// File: models/Exam.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options:      [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
});

const examSchema = new mongoose.Schema({
  year:     { type: String, required: true },
  semester: { type: String, required: true },
  session:  { type: String, required: true },   // e.g. "fall"
  subject:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  examNo:   { type: String, required: true },
  questions: {
    type: [questionSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  assignedSemester: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration:  { type: Number, required: true },
  scheduleDate: { type: Date, required: true },
  scheduleTime: { type: String, required: true },
  finalized: { type: Boolean, default: false },   // ⬅️ NEW
}, {
  timestamps: true,
});

module.exports = mongoose.model('Exam', examSchema);
