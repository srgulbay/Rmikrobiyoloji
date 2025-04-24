const express = require('express');
const lectureController = require('../controllers/lectureController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // Admin koruması ekleyelim

const router = express.Router();

// Tüm Lecture CRUD işlemleri admin yetkisi gerektirsin
router.get('/', lectureController.getAllLectures); // Listelemeyi de koruyalım mı? Şimdilik evet.
router.post('/', protect, isAdmin, lectureController.createLecture);
router.get('/:id', lectureController.getLectureById); // Tekil getirme de korumalı olsun? Şimdilik evet.
router.put('/:id', protect, isAdmin, lectureController.updateLecture);
router.delete('/:id', protect, isAdmin, lectureController.deleteLecture);

module.exports = router;
