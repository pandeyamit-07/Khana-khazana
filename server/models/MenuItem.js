const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    image: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
