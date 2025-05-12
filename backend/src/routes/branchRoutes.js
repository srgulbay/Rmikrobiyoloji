const express = require('express');
const {
    createBranch,
    getAllBranches,
    getBranchById,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/branches - Yeni branş oluştur (Admin)
router.post('/', protect, isAdmin, createBranch);

// GET /api/branches - Tüm branşları listele (Admin ve frontend'de seçim için)
router.get('/', protect, getAllBranches); // Koruma eklendi, tüm kullanıcılar listeyebilir

// GET /api/branches/:id - ID ile branş getir (Admin)
router.get('/:id', protect, isAdmin, getBranchById);

// PUT /api/branches/:id - Branş güncelle (Admin)
router.put('/:id', protect, isAdmin, updateBranch);

// DELETE /api/branches/:id - Branş sil (Admin)
router.delete('/:id', protect, isAdmin, deleteBranch);

module.exports = router;
