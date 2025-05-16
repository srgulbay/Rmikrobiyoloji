const express = require('express');
const {
  getReviewItems,
  submitReviewResult,
  addItemToSRS,
  getSrsSummary
} = require('../controllers/srsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/summary', getSrsSummary);

router.get('/review-items', getReviewItems);

router.post('/submit-review/:userFlashBoxId', submitReviewResult);

router.post('/add-item', addItemToSRS);

module.exports = router;
