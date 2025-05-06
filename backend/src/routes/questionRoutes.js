const express = require('express');
const questionController = require('../controllers/questionController');
// Tutarlılık için 'protect' ve 'isAdmin' kullanalım (veya projenizdeki standardınız neyse onu)
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// --- ÖNCE Spesifik (Sabit) Rotalar ---
// Not: Wordle oyununa sadece giriş yapmış kullanıcıların erişmesi yeterli olabilir, admin şart değil?
// Eğer admin şartsa isAdmin middleware'ini de ekle.
router.get('/wordle-practice', protect, questionController.getWordPracticeQuestions); // Middleware düzeltildi ve üste taşındı
router.post('/bulk', protect, isAdmin, questionController.createBulkQuestions); // Bu zaten doğru yerdeydi ama gruplamak iyi

// --- SONRA Genel ve Parametreli Rotalar ---
router.get('/', protect, questionController.getAllQuestions); // Muhtemelen giriş gerektirir
router.post('/', protect, isAdmin, questionController.createQuestion);
router.get('/:id', protect, questionController.getQuestionById); // ID ile alma artık spesifiklerden sonra
router.put('/:id', protect, isAdmin, questionController.updateQuestion);
router.delete('/:id', protect, isAdmin, questionController.deleteQuestion);

module.exports = router;