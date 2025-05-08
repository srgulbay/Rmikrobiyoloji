const express = require('express');
const {
    getMyStatsSummary,
    getMyDetailedStats,
    getUserDetailedStatsForAdmin,
    getAdminOverviewStats,
    getQuestionStats,
    getAdminUserSummaries,
    recordWordleScore,
    getWordleLeaderboard,
    getMyTopicErrors,
    getGlobalAverages,
    getMyWeeklyProgress // Yeni fonksiyonu import et
} = require('../controllers/statsController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Kullanıcıya özel istatistikler
router.get('/my-summary', protect, getMyStatsSummary);
router.get('/my-detailed', protect, getMyDetailedStats);
router.get('/my-topic-errors', protect, getMyTopicErrors);
router.get('/my-weekly-progress', protect, getMyWeeklyProgress); // Yeni rota eklendi

// Admin'e özel istatistikler
router.get('/admin/overview', protect, isAdmin, getAdminOverviewStats);
router.get('/admin/user-summaries', protect, isAdmin, getAdminUserSummaries);
router.get('/admin/user/:userId/detailed', protect, isAdmin, getUserDetailedStatsForAdmin);

// Genel istatistikler
router.get('/questions', protect, getQuestionStats);
router.get('/global-averages', protect, getGlobalAverages);

// Wordle ile ilgili rotalar
router.post('/wordle-score', protect, recordWordleScore);
router.get('/wordle-leaderboard', protect, getWordleLeaderboard);

module.exports = router;