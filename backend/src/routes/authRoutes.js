const express = require('express');
const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

module.exports = router;