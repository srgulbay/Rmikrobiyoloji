const express = require('express');
const questionController = require('../controllers/questionController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', questionController.getAllQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', protect, isAdmin, questionController.createQuestion);
router.put('/:id', protect, isAdmin, questionController.updateQuestion);
router.delete('/:id', protect, isAdmin, questionController.deleteQuestion);
router.post('/bulk', protect, isAdmin, questionController.createBulkQuestions); // YENİ EKLENDİ

module.exports = router;
