const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: Number,
        unique: true,
    },
    type: {
        type: String,
        enum: ['dine-in', 'delivery', 'pickup'],
        required: [true, 'Order type is required'],
    },
    tableNumber: {
        type: String,
        default: '',
    },
    items: [
        {
            menuItem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MenuItem',
            },
            name: String,
            qty: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    subtotal: {
        type: Number,
        required: true,
    },
    gst: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi'],
        required: [true, 'Payment method is required'],
    },
    customerName: {
        type: String,
        default: '',
        trim: true,
    },
    customerMobile: {
        type: String,
        default: '',
        trim: true,
    },
    customerAddress: {
        type: String,
        default: '',
        trim: true,
    },
    note: {
        type: String,
        default: '',
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'delivered'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-increment order number
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastOrder = await this.constructor.findOne({}, {}, { sort: { orderNumber: -1 } });
        this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
