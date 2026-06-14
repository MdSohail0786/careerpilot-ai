const express = require('express');
const router = express.Router();
const { updateProfile, changePassword, getUserStats } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/stats', getUserStats);

module.exports = router;
