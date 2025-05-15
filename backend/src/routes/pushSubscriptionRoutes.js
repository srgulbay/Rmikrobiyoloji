const express = require('express');
const {
  subscribeToPush,
  unsubscribeFromPush,
} = require('../controllers/pushSubscriptionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm bu rotalar kullanıcı girişi gerektirir
router.use(protect);

// POST /api/push/subscribe - Yeni push aboneliği oluştur
router.post('/subscribe', subscribeToPush);

// POST /api/push/unsubscribe - Push aboneliğini sil
router.post('/unsubscribe', unsubscribeFromPush);

module.exports = router;
