const express = require('express');
const router = express.Router();
const { getOrders, createOrder, deliverOrder, deleteOrder, updateOrder, createCustomerOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// POST /api/orders/customer — public, no auth (customer panel)
// Must be defined BEFORE /:id routes to avoid conflict
router.post('/customer', createCustomerOrder);

// GET /api/orders
router.get('/', protect, getOrders);

// POST /api/orders
router.post('/', protect, createOrder);

// PUT /api/orders/:id/deliver
router.put('/:id/deliver', protect, deliverOrder);

// PUT /api/orders/:id  (edit items)
router.put('/:id', protect, updateOrder);

// DELETE /api/orders/:id
router.delete('/:id', protect, deleteOrder);

module.exports = router;

