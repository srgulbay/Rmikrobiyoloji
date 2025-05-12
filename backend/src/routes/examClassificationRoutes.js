const express = require('express');
const {
    createClassification,
    getAllClassifications,
    getClassificationById,
    updateClassification,
    deleteClassification
} = require('../controllers/examClassificationController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, isAdmin, createClassification);
router.get('/', getAllClassifications); // Bu rota artık herkese açık (RegisterPage'de kullanılacak)
router.get('/:id', protect, isAdmin, getClassificationById);
router.put('/:id', protect, isAdmin, updateClassification);
router.delete('/:id', protect, isAdmin, deleteClassification);

module.exports = router;