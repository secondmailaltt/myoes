// File: routes/examRoutes.js
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const progressController = require('../controllers/progressController'); // ← add this
const { protect, authorize } = require('../middleware/authMiddleware');
const submissionController = require('../controllers/submissionController');


// Teacher-only endpoints
router.post(
  '/create',
  protect,
  authorize('teacher'),
  examController.createExam
);
router.post(
  '/upload',
  protect,
  authorize('teacher'),
  examController.uploadFile
);

router.get(
  '/grouped',
  protect,
  authorize('teacher'),
  examController.getGroupedExams
);
router.get(
  '/filtered',
  protect,
  authorize('teacher'),
  examController.getExamsByFilter
);
router.get(
  '/recent',
  protect,
  authorize('teacher'),
  examController.getRecentExams
);

// Student-only: list only exams assigned to this student
router.get(
  '/available',
  protect,
  authorize('student'),
  examController.getAvailableExams
);

// Teacher-only per-exam routes (parameterized)
// must come *after* any fixed paths like '/available'
router.get(
  '/:id',
  protect,
  authorize('teacher'),
  examController.getExamById
);
router.put(
  '/:id',
  protect,
  authorize('teacher'),
  examController.updateExamById
);
router.delete(
  '/:id',
  protect,
  authorize('teacher'),
  examController.deleteExamById
);

// Student submits their answers
router.post(
  '/:id/submit',
  protect,
  authorize('student'),
  examController.submitExam
);

// // Auto-submit on cheat
// router.post(
//   '/:id/submit-cheat',
//   protect,
//   authorize('student'),
//   async (req, res) => {
//     const { studentId } = req.body;
//     await require('../controllers/progressController')
//              .forceSubmit(req.params.id, studentId);
//     return res.sendStatus(200);
//   }
// );

// Auto-submit on cheat
router.post(
  '/:id/submit-cheat',
  protect,
  authorize('student'),
  async (req, res) => {
    try {
      const { studentId } = req.body;
      await progressController.forceSubmit(req.params.id, studentId);
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Student fetch their exam details by id
router.get(
  '/:id/student',
  protect,
  authorize('student'),
  examController.getExamForStudent
);

// Teacher: list all results for one exam
router.get(
  '/:examId/results',
  protect,
  authorize('teacher'),
  submissionController.resultsByExam
);

module.exports = router;
