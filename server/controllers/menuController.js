const MenuItem = require('../models/MenuItem');
const path = require('path');
const fs = require('fs');

// @desc    Get all menu items
// @route   GET /api/menu
exports.getMenuItems = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
exports.getMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a menu item (Admin only)
// @route   POST /api/menu
exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, quantity } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';

        const item = await MenuItem.create({
            name,
            description,
            price: Number(price),
            category,
            quantity: Number(quantity),
            image,
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a menu item (Admin only)
// @route   PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const { name, description, price, category, quantity } = req.body;

        item.name = name || item.name;
        item.description = description !== undefined ? description : item.description;
        item.price = price !== undefined ? Number(price) : item.price;
        item.category = category || item.category;
        item.quantity = quantity !== undefined ? Number(quantity) : item.quantity;

        if (req.file) {
            // Delete old image if it exists
            if (item.image) {
                const oldPath = path.join(__dirname, '..', item.image);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            item.image = `/uploads/${req.file.filename}`;
        }

        const updated = await item.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a menu item (Admin only)
// @route   DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Delete image file if exists
        if (item.image) {
            const imgPath = path.join(__dirname, '..', item.image);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        }

        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all categories
// @route   GET /api/menu/categories/all
exports.getCategories = async (req, res) => {
    try {
        const categories = await MenuItem.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
