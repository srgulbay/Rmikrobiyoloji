const express = require('express');
const {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch // deleteBranch import edildi
} = require('../controllers/branchController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Genel kullanıcılar için (sadece listeleme)
router.get('/', getAllBranches); // Bu public olabilir veya protect ile korunabilir
router.get('/:id', getBranchById); // Bu public olabilir veya protect ile korunabilir

// Admin işlemleri (protect ve isAdmin ile korunmalı)
router.post('/', protect, isAdmin, createBranch);
router.put('/:id', protect, isAdmin, updateBranch);
router.delete('/:id', protect, isAdmin, deleteBranch); // YENİ: Silme rotası eklendi

module.exports = router;
