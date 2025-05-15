const express = require('express');
const { 
    createAnnouncement, 
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm bu duyuru yönetimi rotaları hem giriş yapmış olmayı (protect) hem de admin yetkisini (isAdmin) gerektirir.

// GET /api/admin/announcements - Tüm duyuruları listele
router.get('/', protect, isAdmin, getAllAnnouncements);

// POST /api/admin/announcements - Yeni duyuru oluştur
router.post('/', protect, isAdmin, createAnnouncement);

// GET /api/admin/announcements/:id - Belirli bir duyuruyu getir
router.get('/:id', protect, isAdmin, getAnnouncementById);

// PUT /api/admin/announcements/:id - Duyuruyu güncelle
router.put('/:id', protect, isAdmin, updateAnnouncement);

// DELETE /api/admin/announcements/:id - Duyuruyu sil
router.delete('/:id', protect, isAdmin, deleteAnnouncement);

module.exports = router;
