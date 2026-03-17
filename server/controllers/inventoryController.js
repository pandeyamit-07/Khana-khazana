const MenuItem = require('../models/MenuItem');

// @desc    Update inventory stock (Admin only)
// @route   PUT /api/inventory/:id
exports.updateStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        const item = await MenuItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.quantity = Number(quantity);
        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
