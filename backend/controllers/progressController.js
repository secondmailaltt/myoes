// backend/controllers/progressController.js

const Progress = require('../models/Progress');
const Exam     = require('../models/Exam');
const Submission = require('../models/Submission');  // ← add this


exports.getProgress = async (req, res) => {
  try {
    const prog = await Progress.findOne({
      user: req.user.id,
      exam: req.params.examId
    }).lean();
    if (!prog) return res.json({});
    res.json({ answers: prog.answers, timeLeft: prog.timeLeft });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load progress' });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    let { answers: answersObj, timeLeft } = req.body;

    // load exam to know how many questions
    const exam = await Exam.findById(req.params.examId).lean();
    const qCount = Array.isArray(exam.questions)
      ? exam.questions.length
      : 0;

    // initialize an array of nulls
    let answersArr = Array(qCount).fill(null);

    if (Array.isArray(answersObj)) {
      // if client already sent an array, sanitize it
      answersArr = answersObj.map(v => (typeof v === 'number' ? v : null));
    } else if (answersObj && typeof answersObj === 'object') {
      // convert object map { "0": 2, "3": 1 } → [2, null, null, 1, ...]
      Object.entries(answersObj).forEach(([key, val]) => {
        const idx = parseInt(key, 10);
        if (!isNaN(idx) && typeof val === 'number') {
          answersArr[idx] = val;
        }
      });
    }

    // upsert progress
    await Progress.findOneAndUpdate(
      { user: req.user.id, exam: req.params.examId },
      { answers: answersArr, timeLeft, updatedAt: Date.now() },
      { upsert: true }
    );

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save progress' });
  }
};

exports.clearProgress = async (req, res) => {
  try {
    await Progress.deleteOne({
      user: req.user.id,
      exam: req.params.examId
    });
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to clear progress' });
  }
};


// new: force-submit for auto-submit on cheat
exports.forceSubmit = async (examId, studentId) => {
  // 1) Progress record dhundo
  const prog = await Progress.findOne({ exam: examId, student: studentId });
  if (!prog) throw new Error('No in-progress exam found');

  // 2) Exam load karo
  const examDoc = await Exam.findById(examId).lean();
  if (!examDoc) throw new Error('Exam not found');

  // 3) Score calculate karo
  const savedAnswers = prog.answers || [];
  const rawScore = (examDoc.questions || []).reduce(
    (sum, q, i) => sum + (savedAnswers[i] === q.correctAnswerIndex ? 1 : 0),
    0
  );

  // 4) Submission create karo
  await Submission.create({
    exam:     examId,
    student:  studentId,
    answers:  savedAnswers,
    score:    rawScore
  });

  // 5) Progress delete karo
  await Progress.deleteOne({ _id: prog._id });
};