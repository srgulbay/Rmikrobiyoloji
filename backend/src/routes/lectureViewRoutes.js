const express = require('express');
const lectureViewController = require('../controllers/lectureViewController');
const { protect } = require('../middleware/authMiddleware'); // Sadece giriş yapmış kullanıcılar kaydedebilir

const router = express.Router();

// POST /api/lecture-views - Yeni bir görüntüleme kaydı oluşturur
router.post('/', protect, lectureViewController.recordLectureView);

// İleride başka lectureView ile ilgili routelar eklenebilir
// Örn: GET /api/lecture-views/my-total-time

module.exports = router;
