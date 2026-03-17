const express = require('express');
const router = express.Router();
const { updateStock } = require('../controllers/inventoryController');
const { protect, isAdmin } = require('../middleware/auth');

// PUT /api/inventory/:id (admin only)
router.put('/:id', protect, isAdmin, updateStock);

module.exports = router;
