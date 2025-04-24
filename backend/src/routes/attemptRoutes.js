const express = require('express');
const attemptController = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware'); // Sadece giriş yapmış kullanıcılar

const router = express.Router();

// POST /api/attempts - Yeni bir deneme kaydet
router.post('/', protect, attemptController.recordAttempt);

// GET /api/attempts - (İleride) Kullanıcının denemelerini listeleme vb.

module.exports = router;
