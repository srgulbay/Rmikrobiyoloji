const express = require('express');
const {
  getAllFlashCards,
  getFlashCardById,
  createFlashCard,
  updateFlashCard,
  deleteFlashCard
} = require('../controllers/flashcardAdminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Bu dosyadaki tüm rotalar admin yetkisi gerektirir ve giriş yapılmış olmalı
router.use(protect, isAdmin);

router.route('/')
  .get(getAllFlashCards)    // GET /api/admin/flashcards - Tüm flash kartları listele
  .post(createFlashCard);   // POST /api/admin/flashcards - Yeni flash kart oluştur

router.route('/:id')
  .get(getFlashCardById)    // GET /api/admin/flashcards/:id - Belirli bir flash kartı getir
  .put(updateFlashCard)     // PUT /api/admin/flashcards/:id - Flash kartı güncelle
  .delete(deleteFlashCard); // DELETE /api/admin/flashcards/:id - Flash kartı sil

module.exports = router;
