const express = require('express');
const { 
    getAllUsers, 
    getUserById, 
    updateUserRole, 
    deleteUser,
    getMyProfile,
    updateMyProfile
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// === Kullanıcının Kendi Profiliyle İlgili Rotalar ===
router.get('/me', protect, getMyProfile);
router.put('/profile', protect, updateMyProfile); // Bu satırın varlığından ve doğruluğundan emin olun

// === Admin Kullanıcı Yönetimi Rotaları ===
router.get('/', protect, isAdmin, getAllUsers);
router.get('/:id', protect, isAdmin, getUserById);
router.put('/:id/role', protect, isAdmin, updateUserRole);
router.delete('/:id', protect, isAdmin, deleteUser);

module.exports = router;
