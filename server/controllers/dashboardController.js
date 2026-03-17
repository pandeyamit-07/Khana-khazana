const Order = require('../models/Order');

// Helper: get date range for period
const getDateRange = (period) => {
    const now = new Date();
    let start;

    if (period === 'daily') {
        // Last 7 days
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
        // Last 4 weeks
        start = new Date(now);
        start.setDate(now.getDate() - 27);
        start.setHours(0, 0, 0, 0);
    } else {
        // Monthly — last 6 months
        start = new Date(now);
        start.setMonth(now.getMonth() - 5);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    return { start, end: now };
};

// Helper: label for a date by period
const getLabel = (date, period) => {
    const d = new Date(date);
    if (period === 'daily') {
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else {
        return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
};

// Helper: group orders into buckets for chart
const buildChartData = (orders, period) => {
    const map = new Map();

    orders.forEach((order) => {
        const d = new Date(order.createdAt);
        let key;

        if (period === 'daily') {
            key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        } else if (period === 'weekly') {
            const dayOfWeek = d.getDay();
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - dayOfWeek);
            key = weekStart.toISOString().slice(0, 10);
        } else {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!map.has(key)) {
            map.set(key, { label: getLabel(d, period), revenue: 0, orders: 0 });
        }
        map.get(key).revenue += order.total;
        map.get(key).orders += 1;
    });

    // Sort chronologically
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => ({ ...v, revenue: parseFloat(v.revenue.toFixed(2)) }));
};

// @desc    Get dashboard analytics
// @route   GET /api/dashboard?period=daily|weekly|monthly&paymentMethod=cash|card|upi
exports.getDashboard = async (req, res) => {
    try {
        const { period = 'daily', paymentMethod } = req.query;
        const { start } = getDateRange(period);

        // Base filter: only delivered orders in the period
        const filter = {
            status: 'delivered',
            createdAt: { $gte: start },
        };
        if (paymentMethod && paymentMethod !== 'all') {
            filter.paymentMethod = paymentMethod;
        }

        const orders = await Order.find(filter).sort({ createdAt: 1 });

        // ── Summary stats ──────────────────────────────────────────────────────
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
        const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

        // ── Payment breakdown (always all methods, irrespective of filter) ─────
        const allPeriodOrders = await Order.find({
            status: 'delivered',
            createdAt: { $gte: start },
        });
        const paymentBreakdown = { cash: 0, card: 0, upi: 0 };
        allPeriodOrders.forEach((o) => {
            if (paymentBreakdown[o.paymentMethod] !== undefined) {
                paymentBreakdown[o.paymentMethod] += 1;
            }
        });

        // ── Sales chart data ───────────────────────────────────────────────────
        const salesChart = buildChartData(orders, period);

        // ── Best-selling items (top 5) ─────────────────────────────────────────
        const itemMap = new Map();
        orders.forEach((order) => {
            order.items.forEach((item) => {
                if (!itemMap.has(item.name)) {
                    itemMap.set(item.name, { name: item.name, qty: 0, revenue: 0 });
                }
                itemMap.get(item.name).qty += item.qty;
                itemMap.get(item.name).revenue += item.qty * item.price;
            });
        });
        const bestSelling = Array.from(itemMap.values())
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5)
            .map((i) => ({ ...i, revenue: parseFloat(i.revenue.toFixed(2)) }));

        // ── Repeat customers % ────────────────────────────────────────────────
        // Among delivered orders with a mobile number, find mobiles that appear > 1
        const allDelivered = await Order.find({ status: 'delivered', customerMobile: { $nin: ['', null] } });
        const mobileCount = new Map();
        allDelivered.forEach((o) => {
            mobileCount.set(o.customerMobile, (mobileCount.get(o.customerMobile) || 0) + 1);
        });
        const totalCustomers = mobileCount.size;
        const repeatCustomers = Array.from(mobileCount.values()).filter((c) => c > 1).length;
        const repeatPercent = totalCustomers > 0
            ? parseFloat(((repeatCustomers / totalCustomers) * 100).toFixed(1))
            : 0;

        res.json({
            summary: {
                totalOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
                repeatPercent,
            },
            salesChart,
            paymentBreakdown,
            bestSelling,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
