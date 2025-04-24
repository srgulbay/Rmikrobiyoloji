const express = require('express');
const userController = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, isAdmin, userController.getAllUsers);
router.get('/:id', protect, isAdmin, userController.getUserById);
router.put('/:id/role', protect, isAdmin, userController.updateUserRole);
router.delete('/:id', protect, isAdmin, userController.deleteUser);

module.exports = router;
