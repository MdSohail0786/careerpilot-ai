const express = require('express');
const router = express.Router();
const { generateReport, getReport, getReportHistory, getReportByInterview } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

// All report routes require authentication
router.use(protect);

router.post('/generate', generateReport);
router.get('/history', getReportHistory);
router.get('/interview/:interviewId', getReportByInterview);
router.get('/:id', getReport);

module.exports = router;
