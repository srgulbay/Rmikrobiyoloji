const express = require('express');
const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    changePassword // YENİ: changePassword fonksiyonu import edildi
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // YENİ: protect middleware'i import edildi

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

// YENİ ROUTE: Giriş yapmış kullanıcının şifresini değiştirmesi için
// Bu rota, kullanıcının kimliğinin doğrulanmış olmasını gerektirir (protect middleware'i)
router.post('/change-password', protect, changePassword);

module.exports = router;
