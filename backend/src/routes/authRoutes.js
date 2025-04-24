const express = require('express');
const authController = require('../controllers/authController'); // Controller'ımız

const router = express.Router();

// POST /api/auth/register endpoint'i (Önceki fazdan)
router.post('/register', authController.registerUser);

// POST /api/auth/login endpoint'i - YENİ EKLENDİ
router.post('/login', authController.loginUser);

module.exports = router;