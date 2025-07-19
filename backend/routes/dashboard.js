// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', auth, dashboardController.getStats);
router.get('/recent-projects', auth, dashboardController.getRecentProjects);
router.get('/yarn-usage', auth, dashboardController.getYarnUsageStats);
router.get('/upcoming-deadlines', auth, dashboardController.getUpcomingDeadlines);
router.get('/completion-rate', auth, dashboardController.getProjectCompletionRate);

module.exports = router;