// const express = require('express');
// const router  = express.Router();
// const multer  = require('multer');
// const Cheat   = require('../models/CheatClip');
// const { protect, authorize } = require('../middleware/authMiddleware');
// const storage = multer.memoryStorage();
// const upload  = multer({ storage });

// // student-only
// router.post('/api/cheats', protect, authorize('student'), upload.single('clip'), async (req, res) => {
//   try {
//     const { studentId, examId } = req.body;
//     const clip = { data: req.file.buffer, contentType: req.file.mimetype };
//     await Cheat.create({ student: studentId, exam: examId, clip });
//     res.sendStatus(201);
//   } catch (err) { res.status(500).json({ error: err.message }) }
// });

// // teacher view
// router.get('/api/cheats', protect, authorize('teacher'), async (req, res) => {
//   const all = await Cheat.find().populate('student exam');
//   res.json(all.map(c => ({
//     id:       c._id,
//     student:  c.student.name,
//     exam:     c.exam.title,
//     timestamp:c.createdAt
//   })));
// });

// // stream raw video
// router.get('/api/cheats/:id/clip', protect, authorize('teacher'), async (req, res) => {
//   const c = await Cheat.findById(req.params.id);
//   res.contentType(c.clip.contentType);
//   res.send(c.clip.data);
// });

// module.exports = router;


// routes/cheatRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Cheat   = require('../models/CheatClip');
const { protect, authorize } = require('../middleware/authMiddleware');

// Memory storage for clip uploads
const storage = multer.memoryStorage();
const upload  = multer({ storage });

// Student-only: upload a 5-second cheat clip
router.post(
  '/',
  protect,
  authorize('student'),
  upload.single('clip'),
  async (req, res) => {
    try {
      const { studentId, examId } = req.body;
      const clip = { data: req.file.buffer, contentType: req.file.mimetype };
      await Cheat.create({ student: studentId, exam: examId, clip });
      res.sendStatus(201);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Teacher-only: list all cheat incidents
router.get(
  '/',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const all = await Cheat.find().populate('student exam');
      res.json(
        all.map(c => ({
          id:        c._id,
          student:   c.student.name,
          exam:      c.exam.title,
          timestamp: c.createdAt
        }))
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Teacher-only: stream raw video clip
router.get(
  '/:id/clip',
  protect,
  authorize('teacher'),
  async (req, res) => {
    try {
      const c = await Cheat.findById(req.params.id);
      if (!c) return res.sendStatus(404);
      res.contentType(c.clip.contentType);
      res.send(c.clip.data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
