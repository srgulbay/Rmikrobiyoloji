const express = require('express');
const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail
} = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register - Kullanıcı kaydı
router.post('/register', registerUser);

// POST /api/auth/login - Kullanıcı girişi
router.post('/login', loginUser);

// GET /api/auth/verify-email/:token - E-posta doğrulama linki için
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/resend-verification-email - Doğrulama e-postasını yeniden gönderme
router.post('/resend-verification-email', resendVerificationEmail);

module.exports = router;