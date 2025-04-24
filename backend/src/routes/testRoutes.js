const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Oluşturduğumuz middleware'i import et

const router = express.Router();

// GET /api/test/protected rotası
// Bu rotaya erişmeden ÖNCE 'protect' middleware'i çalışacak
router.get('/protected', protect, (req, res) => {
  // Eğer 'protect' middleware'i başarıyla geçerse (yani token geçerliyse),
  // req.user içine eklediğimiz bilgilere buradan erişebiliriz.
  res.status(200).json({
    message: 'Başarıyla korumalı rotaya eriştiniz!',
    user: req.user // Middleware'in eklediği kullanıcı bilgisi (token payload'ı)
  });
});

module.exports = router;