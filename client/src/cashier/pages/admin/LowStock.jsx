import { useState, useEffect } from 'react';
import api from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import { FiEdit2, FiX, FiSave, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const LOW_STOCK_THRESHOLD = 10;

export default function LowStock() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchLowStock(); }, []);

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            const res = await api.get('/menu');
            const low = res.data
                .filter((item) => item.quantity < LOW_STOCK_THRESHOLD)
                .sort((a, b) => a.quantity - b.quantity);
            setItems(low);
        } catch (err) {
            toast.error('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (item) => {
        setEditItem(item);
        setEditForm({ name: item.name, price: item.price, category: item.category, quantity: item.quantity, description: item.description || '' });
    };

    const closeEdit = () => { setEditItem(null); setEditForm({}); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
            await api.put(`/menu/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`${editForm.name} updated!`);
            closeEdit();
            fetchLowStock();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update item');
        } finally {
            setSaving(false);
        }
    };

    const getStockLevel = (qty) => qty === 0 ? 'out' : qty <= 3 ? 'critical' : qty <= 6 ? 'warning' : 'low';
    const getStockLabel = (qty) => qty === 0 ? 'Out of Stock' : qty <= 3 ? 'Critical' : qty <= 6 ? 'Very Low' : 'Low';

    return (
        <div>
            <Navbar activePage="low-stock" />
            <div className="low-stock-page">
                <div className="low-stock-header">
                    <div className="low-stock-title">
                        <FiAlertTriangle size={22} className="low-stock-title-icon" />
                        <div>
                            <h2>Low Stock Alert</h2>
                            <p>Items with less than {LOW_STOCK_THRESHOLD} units remaining</p>
                        </div>
                    </div>
                    <button className="btn-refresh-stock" onClick={fetchLowStock}>Refresh</button>
                </div>

                {loading ? (
                    <div className="ls-loading"><div className="spinner" /><p>Checking stock levels…</p></div>
                ) : items.length === 0 ? (
                    <div className="ls-empty"><FiPackage size={48} className="ls-empty-icon" /><h3>All good! 🎉</h3><p>All items are sufficiently stocked.</p></div>
                ) : (
                    <>
                        <div className="ls-count-bar">
                            <span><strong>{items.length}</strong> item{items.length !== 1 ? 's' : ''} need restocking</span>
                        </div>
                        <div className="ls-grid">
                            {items.map((item) => {
                                const level = getStockLevel(item.quantity);
                                return (
                                    <div key={item._id} className={`ls-card ls-card--${level}`}>
                                        <div className={`ls-level-badge ls-level--${level}`}>{getStockLabel(item.quantity)}</div>
                                        <div className="ls-card-img-wrap">
                                            {item.image ? <img src={item.image} alt={item.name} className="ls-card-img" /> : <div className="ls-card-img-placeholder">🍴</div>}
                                        </div>
                                        <div className="ls-card-body">
                                            <div className="ls-card-name">{item.name}</div>
                                            <div className="ls-card-category">{item.category}</div>
                                            <div className="ls-card-price">₹{item.price}</div>
                                            <div className="ls-stock-row">
                                                <span className="ls-stock-label">Stock</span>
                                                <div className="ls-stock-bar-wrap">
                                                    <div className={`ls-stock-bar ls-bar--${level}`} style={{ width: `${Math.min(100, (item.quantity / LOW_STOCK_THRESHOLD) * 100)}%` }} />
                                                </div>
                                                <span className={`ls-qty ls-qty--${level}`}>{item.quantity}</span>
                                            </div>
                                        </div>
                                        <button className="btn-ls-edit" onClick={() => openEdit(item)}><FiEdit2 size={13} /> Edit Stock</button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {editItem && (
                <div className="modal-overlay" onClick={closeEdit}>
                    <div className="modal ls-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit — {editItem.name}</h3>
                            <button className="modal-close" onClick={closeEdit}><FiX /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group"><label>Product Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                                <div className="form-group"><label>Category</label><input type="text" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} required /></div>
                                <div className="form-group"><label>Price (₹)</label><input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} min="0" step="0.01" required /></div>
                                <div className="form-group">
                                    <label>Quantity (Stock)<span className="ls-qty-hint"> — currently {editItem.quantity}</span></label>
                                    <input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} min="0" required autoFocus style={{ border: '2px solid', borderColor: Number(editForm.quantity) >= 10 ? '#22c55e' : Number(editForm.quantity) <= 3 ? '#ef4444' : '#f97316' }} />
                                    {Number(editForm.quantity) >= 10 && <p className="ls-qty-ok">✅ Will clear the low stock alert</p>}
                                </div>
                                <div className="form-group"><label>Description</label><input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional" /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeEdit}>Cancel</button>
                                <button type="submit" className="btn-add-item" disabled={saving}><FiSave size={14} style={{ marginRight: 4 }} />{saving ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
