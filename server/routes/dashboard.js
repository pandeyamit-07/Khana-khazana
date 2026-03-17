const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect, isAdmin } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', protect, isAdmin, getDashboard);

module.exports = router;
