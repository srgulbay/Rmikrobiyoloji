const express = require('express');
const statsController = require('../controllers/statsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my-summary', protect, statsController.getMyStatsSummary);
router.get('/my-detailed', protect, statsController.getMyDetailedStats);
router.get('/admin/overview', protect, isAdmin, statsController.getAdminOverviewStats);
router.get('/admin/user/:userId/detailed', protect, isAdmin, statsController.getUserDetailedStatsForAdmin);
router.get('/questions', protect, statsController.getQuestionStats);
router.get('/admin/user-summaries', protect, isAdmin, statsController.getAdminUserSummaries);
router.post('/wordle-score', protect, statsController.recordWordleScore);
router.get('/wordle-leaderboard', protect, statsController.getWordleLeaderboard);

module.exports = router;
