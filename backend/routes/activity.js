// backend/routes/activity.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.get('/recent', auth, activityController.getRecentActivity);
router.get('/summary', auth, activityController.getActivitySummary);
router.get('/calendar', auth, activityController.getActivityCalendar);
router.get('/export', auth, activityController.exportActivityLog);

module.exports = router;