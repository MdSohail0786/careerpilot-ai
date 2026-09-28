const express = require('express');
const router = express.Router();
const { startInterview, submitAnswer, nextQuestion, getInterview } = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

// All interview routes require authentication
router.use(protect);

router.post('/start', startInterview);
router.post('/answer', submitAnswer);
router.post('/next', nextQuestion);
router.get('/:id', getInterview);

module.exports = router;
