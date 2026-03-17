const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    Get orders (with optional filters)
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;

        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Place a new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    try {
        const { type, tableNumber, items, paymentMethod, customerName, customerMobile } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        // Decrement stock for each item
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({ message: `Menu item not found: ${item.name}` });
            }
            if (menuItem.quantity < item.qty) {
                return res.status(400).json({
                    message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.quantity}`,
                });
            }
            menuItem.quantity -= item.qty;
            await menuItem.save();
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const gst = Math.round(subtotal * 0.05 * 100) / 100;
        const total = Math.round((subtotal + gst) * 100) / 100;

        const order = await Order.create({
            type,
            tableNumber: tableNumber || '',
            items,
            subtotal,
            gst,
            total,
            paymentMethod,
            customerName: customerName || '',
            customerMobile: customerMobile || '',
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
exports.deliverOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = 'delivered';
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an order (restores stock)
// @route   DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Restore stock for each item
        for (const item of order.items) {
            await MenuItem.findByIdAndUpdate(item.menuItem, {
                $inc: { quantity: item.qty },
            });
        }

        await order.deleteOne();
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an active order's items
// @route   PUT /api/orders/:id
exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { items } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        // Restore old stock first
        for (const item of order.items) {
            await MenuItem.findByIdAndUpdate(item.menuItem, {
                $inc: { quantity: item.qty },
            });
        }

        // Validate and deduct new stock
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({ message: `Menu item not found: ${item.name}` });
            }
            if (menuItem.quantity < item.qty) {
                return res.status(400).json({
                    message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.quantity}`,
                });
            }
            menuItem.quantity -= item.qty;
            await menuItem.save();
        }

        // Recalculate totals
        const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const gst = Math.round(subtotal * 0.05 * 100) / 100;
        const total = Math.round((subtotal + gst) * 100) / 100;

        order.items = items;
        order.subtotal = subtotal;
        order.gst = gst;
        order.total = total;
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Place a new order from the public customer panel (no auth required)
// @route   POST /api/orders/customer
exports.createCustomerOrder = async (req, res) => {
    try {
        const { type, tableNumber, items, paymentMethod, customerName, customerMobile, customerAddress, note } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }
        if (!customerName || !customerMobile) {
            return res.status(400).json({ message: 'Customer name and mobile are required' });
        }

        // Decrement stock for each item
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({ message: `Menu item not found: ${item.name}` });
            }
            if (menuItem.quantity < item.qty) {
                return res.status(400).json({
                    message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.quantity}`,
                });
            }
            menuItem.quantity -= item.qty;
            await menuItem.save();
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const gst = Math.round(subtotal * 0.05 * 100) / 100;
        const total = Math.round((subtotal + gst) * 100) / 100;

        const order = await Order.create({
            type,
            tableNumber: tableNumber || '',
            items,
            subtotal,
            gst,
            total,
            paymentMethod: paymentMethod || 'cash',
            customerName,
            customerMobile,
            customerAddress: customerAddress || '',
            note: note || '',
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

