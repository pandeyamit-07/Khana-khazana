import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import {
    FiFilter, FiCheckCircle, FiTruck, FiShoppingBag, FiLayers,
    FiEdit2, FiTrash2, FiPlus, FiMinus, FiX, FiSave
} from 'react-icons/fi';
import Navbar from '../components/Navbar';

export default function CurrentOrders() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');

    const [editOrder, setEditOrder] = useState(null);
    const [editItems, setEditItems] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders?status=active');
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders');
        }
    };

    const handleDeliver = async (id) => {
        try {
            await api.put(`/orders/${id}/deliver`);
            toast.success('Order marked as delivered!');
            fetchOrders();
        } catch (err) {
            toast.error('Failed to update order');
        }
    };

    const handleDelete = async (order) => {
        if (!window.confirm(`Delete order #${order.orderNumber}? This will restore stock.`)) return;
        try {
            await api.delete(`/orders/${order._id}`);
            toast.success('Order deleted');
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete order');
        }
    };

    const openEdit = (order) => {
        setEditOrder(order);
        setEditItems(order.items.map((it) => ({ ...it })));
    };

    const closeEdit = () => {
        setEditOrder(null);
        setEditItems([]);
    };

    const updateEditQty = (idx, delta) => {
        setEditItems((prev) =>
            prev
                .map((it, i) => (i === idx ? { ...it, qty: it.qty + delta } : it))
                .filter((it) => it.qty > 0)
        );
    };

    const handleSaveEdit = async () => {
        if (editItems.length === 0) {
            toast.error('Order must have at least one item');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/orders/${editOrder._id}`, { items: editItems });
            toast.success('Order updated!');
            closeEdit();
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order');
        } finally {
            setSaving(false);
        }
    };

    const filteredOrders =
        filter === 'all' ? orders : orders.filter((o) => o.type === filter);

    const getCounts = (type) =>
        type === 'all' ? orders.length : orders.filter((o) => o.type === type).length;

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const editSubtotal = editItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const editGst = Math.round(editSubtotal * 0.05 * 100) / 100;
    const editTotal = Math.round((editSubtotal + editGst) * 100) / 100;

    const isAdmin = user?.role === 'admin';

    return (
        <div>
            <Navbar activePage="current-orders" />

            <div className="orders-layout">
                {/* LEFT SIDEBAR - Filters */}
                <div className="orders-sidebar">
                    <div className="sidebar-title">Order Filters</div>
                    {[
                        { key: 'all', label: 'All Orders', icon: <FiLayers size={14} /> },
                        { key: 'dine-in', label: 'Dine In', icon: <FiShoppingBag size={14} /> },
                        { key: 'pickup', label: 'Pick Up', icon: <FiFilter size={14} /> },
                        { key: 'delivery', label: 'Delivery', icon: <FiTruck size={14} /> },
                    ].map((f) => (
                        <button
                            key={f.key}
                            className={`filter-item ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.icon} {f.label}
                            <span className="filter-count">{getCounts(f.key)}</span>
                        </button>
                    ))}
                </div>

                {/* ORDER CARDS */}
                <div className="orders-grid-section">
                    <div className="menu-header">
                        <h2>Active Orders</h2>
                        <span className="menu-count">{filteredOrders.length} orders</span>
                    </div>
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>No active orders</h3>
                            <p>New orders will appear here automatically</p>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {filteredOrders.map((order) => (
                                <div key={order._id} className="order-card">
                                    <div className="order-card-header">
                                        <div>
                                            <span className="order-badge">{order.type}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="order-number">#{order.orderNumber}</div>
                                            <div className="order-time">{formatTime(order.createdAt)}</div>
                                        </div>
                                    </div>
                                    <div className="order-card-body">
                                        <table className="order-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name}</td>
                                                        <td>{item.qty}</td>
                                                        <td>₹{(item.price * item.qty).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="order-card-total">
                                            <span>Total</span>
                                            <span>₹{order.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="order-card-footer">
                                        <div className="order-customer">
                                            {order.customerName && <div><strong>{order.customerName}</strong></div>}
                                            {order.customerMobile && <div>{order.customerMobile}</div>}
                                            {order.tableNumber && <div>Table: {order.tableNumber}</div>}
                                        </div>
                                        <div className="order-card-actions">
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        className="btn-edit-order"
                                                        onClick={() => openEdit(order)}
                                                        title="Edit Order"
                                                    >
                                                        <FiEdit2 size={13} /> Edit
                                                    </button>
                                                    <button
                                                        className="btn-delete-order"
                                                        onClick={() => handleDelete(order)}
                                                        title="Delete Order"
                                                    >
                                                        <FiTrash2 size={13} /> Delete
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn-deliver" onClick={() => handleDeliver(order._id)}>
                                                <FiCheckCircle size={14} style={{ marginRight: '4px' }} />
                                                Delivered
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* EDIT ORDER MODAL */}
            {editOrder && (
                <div className="modal-overlay" onClick={closeEdit}>
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <h3>Edit Order <span>#{editOrder.orderNumber}</span></h3>
                            <button className="modal-close-btn" onClick={closeEdit}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="edit-modal-body">
                            {editItems.length === 0 ? (
                                <p className="edit-empty">All items removed. Save will be blocked.</p>
                            ) : (
                                editItems.map((item, idx) => (
                                    <div key={idx} className="edit-item-row">
                                        <div className="edit-item-name">{item.name}</div>
                                        <div className="edit-item-price">₹{item.price}</div>
                                        <div className="qty-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateEditQty(idx, -1)}
                                            >
                                                <FiMinus size={12} />
                                            </button>
                                            <span className="qty-value">{item.qty}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateEditQty(idx, 1)}
                                            >
                                                <FiPlus size={12} />
                                            </button>
                                        </div>
                                        <div className="edit-item-total">
                                            ₹{(item.price * item.qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="edit-modal-footer">
                            <div className="edit-totals">
                                <div className="edit-total-row">
                                    <span>Subtotal</span><span>₹{editSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="edit-total-row">
                                    <span>GST @5%</span><span>₹{editGst.toFixed(2)}</span>
                                </div>
                                <div className="edit-total-row grand">
                                    <span>Total</span><span>₹{editTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                className="btn-save-edit"
                                onClick={handleSaveEdit}
                                disabled={saving || editItems.length === 0}
                            >
                                <FiSave size={14} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
