import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiCalendar } from 'react-icons/fi';
import Navbar from '../components/Navbar';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders?status=delivered');
            // Sort by newest first
            const sorted = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sorted);
        } catch (err) {
            toast.error('Failed to load order history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const toISODate = (dateStr) => {
        // Returns YYYY-MM-DD for comparison with dateFilter
        return new Date(dateStr).toISOString().slice(0, 10);
    };

    const filteredOrders = orders.filter((order) => {
        const matchesDate = dateFilter ? toISODate(order.createdAt) === dateFilter : true;
        const matchesSearch = searchId
            ? String(order.orderNumber).includes(searchId.replace('#', ''))
            : true;
        return matchesDate && matchesSearch;
    });

    const handleDownloadBill = (order) => {
        const bill = `
═══════════════════════════════
    🍽️ KHANA khazana
    Restaurant & Cafe
═══════════════════════════════
Order #${order.orderNumber}
Date:    ${formatDate(order.createdAt)}
Time:    ${formatTime(order.createdAt)}
Type:    ${order.type.toUpperCase()}
${order.tableNumber ? `Table:   ${order.tableNumber}` : ''}
${order.customerName ? `Customer: ${order.customerName}` : ''}
${order.customerMobile ? `Mobile:  ${order.customerMobile}` : ''}
───────────────────────────────
${order.items.map((o) => `${o.name} x${o.qty}    ₹${(o.price * o.qty).toFixed(2)}`).join('\n')}
───────────────────────────────
Subtotal:   ₹${order.subtotal.toFixed(2)}
GST @5%:    ₹${order.gst.toFixed(2)}
TOTAL:      ₹${order.total.toFixed(2)}
Payment:    ${order.paymentMethod.toUpperCase()}
═══════════════════════════════
    Thank you for dining!
═══════════════════════════════
`;
        const win = window.open('', '_blank', 'width=420,height=650');
        win.document.write(
            `<pre style="font-family:monospace;font-size:14px;padding:24px;">${bill}</pre>`
        );
        win.document.close();
        win.print();
    };

    return (
        <div>
            <Navbar activePage="order-history" />

            <div className="history-page">
                {/* Header Banner */}
                <div className="history-banner">
                    <h1>Past Orders</h1>
                </div>

                {/* Filters */}
                <div className="history-filters">
                    <div className="history-date-filter">
                        <FiCalendar size={15} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                        {dateFilter && (
                            <button
                                className="clear-date-btn"
                                onClick={() => setDateFilter('')}
                                title="Clear date filter"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <div className="history-search">
                        <FiSearch size={15} />
                        <input
                            type="text"
                            placeholder="Enter order ID here..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        <button className="btn-search">
                            <FiSearch size={14} /> Search
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="history-table-wrap">
                    {loading ? (
                        <div className="history-loading">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="history-empty">
                            <div style={{ fontSize: '2.5rem' }}>📋</div>
                            <p>No orders found</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td className="order-id-cell">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="date-cell">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="time-cell">
                                            {formatTime(order.createdAt)}
                                        </td>
                                        <td>₹{order.total.toFixed(0)}</td>
                                        <td>
                                            <button
                                                className="btn-download-bill"
                                                onClick={() => handleDownloadBill(order)}
                                            >
                                                <FiDownload size={13} /> Download Bill
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
