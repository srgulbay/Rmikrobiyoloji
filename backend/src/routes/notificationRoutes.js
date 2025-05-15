const express = require('express');
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // Kullanıcı girişi kontrolü

const router = express.Router();

// Tüm bu rotalar kullanıcı girişi gerektirir
router.use(protect);

// GET /api/notifications/my-notifications - Kullanıcının bildirimlerini getir
router.get('/my-notifications', getMyNotifications);

// POST /api/notifications/:id/mark-as-read - Belirli bir bildirimi okundu yap
router.post('/:id/mark-as-read', markNotificationAsRead);

// POST /api/notifications/mark-all-as-read - Tüm bildirimleri okundu yap
router.post('/mark-all-as-read', markAllNotificationsAsRead);

module.exports = router;
