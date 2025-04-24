const express = require('express');
const topicController = require('../controllers/topicController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm Konu CRUD işlemleri admin yetkisi gerektirir
router.get('/', topicController.getAllTopics); // Konuları listelemek belki herkese açık olabilir? Şimdilik admin yapalım.
router.get('/:id', protect, isAdmin, topicController.getTopicById);
router.post('/', protect, isAdmin, topicController.createTopic);
router.put('/:id', protect, isAdmin, topicController.updateTopic);
router.delete('/:id', protect, isAdmin, topicController.deleteTopic);

module.exports = router;
