const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // Korumayı ekleyelim
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Multer için depolama yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dosyaların kaydedileceği klasör
  },
  filename: function (req, file, cb) {
    // Dosya adını benzersiz yapalım (tarih + orijinal ad)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Dosya tipi kontrolü (opsiyonel ama önerilir)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Hata: Sadece resim dosyaları yüklenebilir (jpeg, jpg, png, gif)!', false);
  }
};

// Multer middleware'ini oluştur
const upload = multer({
   storage: storage,
   fileFilter: fileFilter,
   limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB (opsiyonel)
});

// POST /api/upload/image rotası
// Önce giriş kontrolü (protect), sonra admin kontrolü (isAdmin),
// sonra 'file' adındaki tek dosyayı işle (upload.single),
// en son controller fonksiyonunu çalıştır.
router.post(
    '/image',
    protect,
    isAdmin,
    upload.single('file'), // 'file' -> frontend'den gönderilecek dosyanın key adı
    uploadController.uploadImage
);


module.exports = router;
