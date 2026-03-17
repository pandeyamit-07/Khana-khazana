import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

export default function Inventory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category: '', quantity: '',
    });
    const [imageFile, setImageFile] = useState(null);

    // Helper function to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
            return imagePath;
        }
        // Backend is running on same domain but different port for dev
        const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        return `${backendUrl}/${imagePath}`;
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await api.get('/menu');
            setItems(res.data);
        } catch (err) {
            toast.error('Failed to load inventory');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', category: '', quantity: '' });
        setImageFile(null);
    };

    // ADD ITEM
    const handleAdd = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('price', formData.price);
        fd.append('category', formData.category);
        fd.append('quantity', formData.quantity);
        if (imageFile) fd.append('image', imageFile);

        try {
            await api.post('/menu', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Item added successfully!');
            setShowAddModal(false);
            resetForm();
            fetchItems();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add item');
        }
    };

    // EDIT ITEM
    const openEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category,
            quantity: item.quantity,
        });
        setImageFile(null);
        setShowEditModal(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('price', formData.price);
        fd.append('category', formData.category);
        fd.append('quantity', formData.quantity);
        if (imageFile) fd.append('image', imageFile);

        try {
            await api.put(`/menu/${selectedItem._id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Item updated successfully!');
            setShowEditModal(false);
            resetForm();
            setSelectedItem(null);
            fetchItems();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update item');
        }
    };

    // DELETE ITEM
    const openDelete = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/menu/${selectedItem._id}`);
            toast.success('Item deleted successfully!');
            setShowDeleteModal(false);
            setSelectedItem(null);
            fetchItems();
        } catch (err) {
            toast.error('Failed to delete item');
        }
    };


    const ItemForm = ({ onSubmit, submitLabel }) => (
        <form onSubmit={onSubmit}>
            <div className="modal-body">
                <div className="form-group">
                    <label>Product Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter item name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Choose Image</label>
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description"
                    />
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="Available stock"
                        min="0"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Pizza, Burgers, Drinks"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Price in rupees"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn-reset" onClick={resetForm}>
                    Reset
                </button>
                <button type="submit" className="btn-add-item">
                    {submitLabel}
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <Navbar activePage="inventory" />

            {/* INVENTORY CONTENT */}
            <div style={{ padding: '1.5rem', overflow: 'auto', height: 'calc(100vh - 64px)' }}>
                <div className="inventory-header">
                    <h2>📦 Inventory Management</h2>
                    <span className="menu-count">{items.length} items</span>
                </div>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <h3>No items in inventory</h3>
                        <p>Click the + button to add your first menu item</p>
                    </div>
                ) : (
                    <div className="inventory-grid">
                        {items.map((item) => (
                            <div key={item._id} className="inventory-card">
                                {item.image ? (
                                    <img src={getImageUrl(item.image)} alt={item.name} className="inventory-card-img" />
                                ) : (
                                    <div className="inventory-card-img" style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem', color: 'var(--text-muted)', background: 'var(--bg-input)'
                                    }}>
                                        🍴
                                    </div>
                                )}
                                <div className="inventory-card-body">
                                    <div className="inventory-card-name">{item.name}</div>
                                    <div className="inventory-card-desc">{item.description || 'No description'}</div>
                                    <div className="inventory-card-meta">
                                        <span className="inventory-card-category">{item.category}</span>
                                        <span className="inventory-card-price">₹{item.price}</span>
                                    </div>
                                    <div className="inventory-card-stock">
                                        Stock: <strong>{item.quantity}</strong> units
                                    </div>
                                    <div className="inventory-card-actions">
                                        <button className="btn-edit" onClick={() => openEdit(item)}>
                                            <FiEdit2 size={13} /> Edit
                                        </button>
                                        <button className="btn-delete" onClick={() => openDelete(item)}>
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB Add Button */}
            <button className="fab-add" onClick={() => { resetForm(); setShowAddModal(true); }}>
                <FiPlus size={24} />
            </button>

            {/* ADD MODAL */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Item</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <ItemForm onSubmit={handleAdd} submitLabel="Add Item" />
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Item</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <ItemForm onSubmit={handleEdit} submitLabel="Update Item" />
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Delete Item</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <p>Are you sure you want to delete</p>
                                <p className="item-name">{selectedItem?.name}</p>
                                <p>This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleDelete}>
                                Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
