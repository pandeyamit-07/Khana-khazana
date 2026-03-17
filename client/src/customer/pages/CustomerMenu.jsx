import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiX, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';

const CATEGORY_ICONS = {
    'Refreshments': '🥤', 'Breakfast': '🍳', 'Pavbhaji': '🍛', 'Frankie': '🌯',
    'Pizza': '🍕', 'Sandwich': '🥪', 'Burgers': '🍔', 'Fries': '🍟',
    'Noodles': '🍜', 'Desserts': '🍰', 'Drinks': '🧃', 'Thali': '🍱',
    'Rice': '🍚', 'Roti': '🫓',
};

const getImageUrl = (item) => {
    if (!item.image) return null;
    if (item.image.startsWith('http')) return item.image;
    if (item.image.startsWith('/')) return item.image;
    return `/${item.image}`;
};

// Public api (no auth)
const publicApi = axios.create({ baseURL: '/api' });

export default function CustomerMenu() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState([]); // { menuItem, name, qty, price, image }
    const [cartOpen, setCartOpen] = useState(false);

    // Order form state
    const [orderType, setOrderType] = useState('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [orderNote, setOrderNote] = useState('');
    const [placing, setPlacing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => { fetchMenu(); }, []);

    const fetchMenu = async () => {
        try {
            const res = await publicApi.get('/menu');
            setMenuItems(res.data);
            const cats = [...new Set(res.data.map((item) => item.category))];
            setCategories(cats);
        } catch {
            toast.error('Could not load menu');
        }
    };

    const filteredItems = activeCategory === 'All'
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory);

    // Cart helpers
    const addToCart = (item) => {
        if (item.quantity <= 0) { toast.error('Out of stock'); return; }
        setCart((prev) => {
            const ex = prev.find((c) => c.menuItem === item._id);
            if (ex) {
                if (ex.qty >= item.quantity) { toast.error(`Only ${item.quantity} available`); return prev; }
                return prev.map((c) => c.menuItem === item._id ? { ...c, qty: c.qty + 1 } : c);
            }
            return [...prev, { menuItem: item._id, name: item.name, qty: 1, price: item.price, image: item.image }];
        });
    };

    const removeFromCart = (menuItemId) => {
        setCart((prev) => prev.filter((c) => c.menuItem !== menuItemId));
    };

    const updateCartQty = (menuItemId, delta) => {
        setCart((prev) =>
            prev.map((c) => c.menuItem === menuItemId ? { ...c, qty: c.qty + delta } : c)
                .filter((c) => c.qty > 0)
        );
    };

    const cartCount = cart.reduce((s, c) => s + c.qty, 0);
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;

    const getItemQtyInCart = (itemId) => {
        const c = cart.find((c) => c.menuItem === itemId);
        return c ? c.qty : 0;
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) { toast.error('Your cart is empty'); return; }
        if (!customerName.trim()) { toast.error('Please enter your name'); return; }
        if (!customerMobile.trim()) { toast.error('Please enter your mobile number'); return; }
        if (orderType === 'dine-in' && !tableNumber.trim()) { toast.error('Please enter your table number'); return; }
        if (orderType === 'delivery' && !customerAddress.trim()) { toast.error('Please enter delivery address'); return; }

        setPlacing(true);
        try {
            await publicApi.post('/orders/customer', {
                type: orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
                items: cart.map((c) => ({ menuItem: c.menuItem, name: c.name, qty: c.qty, price: c.price })),
                paymentMethod,
                customerName,
                customerMobile,
                customerAddress: orderType === 'delivery' ? customerAddress : undefined,
                note: orderNote || undefined,
            });
            setOrderSuccess(true);
            setCart([]);
            setCustomerName('');
            setCustomerMobile('');
            setCustomerAddress('');
            setTableNumber('');
            setOrderNote('');
            fetchMenu();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };

    const resetSuccess = () => { setOrderSuccess(false); setCartOpen(false); };

    return (
        <div className="customer-layout">
            {/* ── HEADER ── */}
            <header className="customer-header">
                <div className="customer-brand">
                    <span className="customer-brand-icon">🍽️</span>
                    <div>
                        <div className="customer-brand-name">Khana khazana</div>
                        <div className="customer-brand-tagline">Fresh • Fast • Delicious</div>
                    </div>
                </div>
                <button
                    className="customer-cart-btn"
                    onClick={() => setCartOpen(true)}
                >
                    <FiShoppingCart size={20} />
                    <span>Cart</span>
                    {cartCount > 0 && <span className="customer-cart-badge">{cartCount}</span>}
                </button>
            </header>

            <div className="customer-body">
                {/* ── LEFT: Category Sidebar ── */}
                <aside className="customer-sidebar">
                    <div className="customer-sidebar-title">Categories</div>
                    <button
                        className={`customer-cat-btn ${activeCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('All')}
                    >
                        <span>📋</span> All Items
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`customer-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            <span>{CATEGORY_ICONS[cat] || '🍴'}</span> {cat}
                        </button>
                    ))}
                </aside>

                {/* ── RIGHT: Menu Grid ── */}
                <main className="customer-menu">
                    <div className="customer-menu-header">
                        <h2>{activeCategory === 'All' ? 'Our Menu' : activeCategory}</h2>
                        <span className="customer-menu-count">{filteredItems.length} items</span>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="customer-empty">
                            <div style={{ fontSize: '3rem' }}>🍽️</div>
                            <p>No items in this category</p>
                        </div>
                    ) : (
                        <div className="customer-grid">
                            {filteredItems.map((item) => {
                                const imgUrl = getImageUrl(item);
                                const inCart = getItemQtyInCart(item._id);
                                const outOfStock = item.quantity <= 0;
                                return (
                                    <div key={item._id} className={`customer-card ${outOfStock ? 'out-of-stock' : ''}`}>
                                        {/* Image */}
                                        <div className="customer-card-img-wrap">
                                            {imgUrl ? (
                                                <img
                                                    src={imgUrl}
                                                    alt={item.name}
                                                    className="customer-card-img"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="customer-card-emoji"
                                                style={{ display: imgUrl ? 'none' : 'flex' }}
                                            >
                                                {CATEGORY_ICONS[item.category] || '🍴'}
                                            </div>
                                            {outOfStock && <div className="customer-card-oos-badge">Out of Stock</div>}
                                        </div>

                                        {/* Info */}
                                        <div className="customer-card-body">
                                            <div className="customer-card-name">{item.name}</div>
                                            {item.description && (
                                                <div className="customer-card-desc">{item.description}</div>
                                            )}
                                            <div className="customer-card-footer">
                                                <span className="customer-card-price">₹{item.price}</span>

                                                {outOfStock ? (
                                                    <span className="customer-card-unavail">Unavailable</span>
                                                ) : inCart === 0 ? (
                                                    <button
                                                        className="customer-btn-add"
                                                        onClick={() => addToCart(item)}
                                                    >
                                                        <FiPlus size={14} /> Add
                                                    </button>
                                                ) : (
                                                    <div className="customer-qty-ctrl">
                                                        <button onClick={() => updateCartQty(item._id, -1)}><FiMinus size={13} /></button>
                                                        <span>{inCart}</span>
                                                        <button onClick={() => addToCart(item)}><FiPlus size={13} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* ── CART DRAWER ── */}
            {cartOpen && (
                <div className="customer-drawer-overlay" onClick={() => setCartOpen(false)}>
                    <div className="customer-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="customer-drawer-header">
                            <h3>🛒 Your Order</h3>
                            <button className="customer-drawer-close" onClick={() => setCartOpen(false)}>
                                <FiX size={20} />
                            </button>
                        </div>

                        {orderSuccess ? (
                            /* ── SUCCESS STATE ── */
                            <div className="customer-order-success">
                                <div className="customer-success-icon">✅</div>
                                <h3>Order Placed!</h3>
                                <p>Your order has been received. We'll have it ready soon!</p>
                                <button className="customer-btn-primary" onClick={resetSuccess}>
                                    Order More
                                </button>
                            </div>
                        ) : (
                            <div className="customer-drawer-body">
                                {/* Order Type */}
                                <div className="customer-section">
                                    <div className="customer-section-title">Select Order Type</div>
                                    <div className="customer-order-types">
                                        {[
                                            { key: 'dine-in', label: '🪑 Dine-in' },
                                            { key: 'delivery', label: '🚚 Delivery' },
                                            { key: 'pickup', label: '🛍️ Pickup' },
                                        ].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                className={`customer-order-type-btn ${orderType === key ? 'active' : ''}`}
                                                onClick={() => setOrderType(key)}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div className="customer-section">
                                    <div className="customer-section-title">Customer Details</div>
                                    <div className="customer-input-group">
                                        <FiUser size={15} className="customer-input-icon" />
                                        <input
                                            type="text"
                                            placeholder="Your Name *"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                    <div className="customer-input-group">
                                        <FiPhone size={15} className="customer-input-icon" />
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number *"
                                            value={customerMobile}
                                            onChange={(e) => setCustomerMobile(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Table / Address */}
                                {orderType === 'dine-in' && (
                                    <div className="customer-section">
                                        <div className="customer-section-title">Table Selection</div>
                                        <select
                                            className="customer-select"
                                            value={tableNumber}
                                            onChange={(e) => setTableNumber(e.target.value)}
                                        >
                                            <option value="">Select Table Number *</option>
                                            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                                                <option key={n} value={n}>Table {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {orderType === 'delivery' && (
                                    <div className="customer-section">
                                        <div className="customer-section-title">Delivery Address</div>
                                        <div className="customer-input-group">
                                            <FiMapPin size={15} className="customer-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Full delivery address *"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Cart Items */}
                                <div className="customer-section">
                                    <div className="customer-section-title">Cart Items</div>
                                    {cart.length === 0 ? (
                                        <div className="customer-cart-empty">No items added yet. Go pick some!</div>
                                    ) : (
                                        <div className="customer-cart-list">
                                            {cart.map((item) => (
                                                <div key={item.menuItem} className="customer-cart-item">
                                                    <div className="customer-cart-item-info">
                                                        <span className="customer-cart-item-name">{item.name}</span>
                                                        <span className="customer-cart-item-unit">₹{item.price} each</span>
                                                    </div>
                                                    <div className="customer-cart-item-right">
                                                        <div className="customer-qty-ctrl">
                                                            <button onClick={() => updateCartQty(item.menuItem, -1)}><FiMinus size={11} /></button>
                                                            <span>{item.qty}</span>
                                                            <button onClick={() => updateCartQty(item.menuItem, 1)}><FiPlus size={11} /></button>
                                                        </div>
                                                        <span className="customer-cart-item-total">₹{(item.price * item.qty).toFixed(2)}</span>
                                                        <button className="customer-cart-remove" onClick={() => removeFromCart(item.menuItem)}><FiTrash2 size={13} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Order Note */}
                                {cart.length > 0 && (
                                    <div className="customer-section">
                                        <div className="customer-section-title">Order Note <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></div>
                                        <textarea
                                            className="customer-note"
                                            placeholder="e.g. extra spicy, no onions..."
                                            value={orderNote}
                                            onChange={(e) => setOrderNote(e.target.value)}
                                            maxLength={200}
                                            rows={2}
                                        />
                                        <div className="customer-note-count">{orderNote.length}/200</div>
                                    </div>
                                )}

                                {/* Bill Details */}
                                {cart.length > 0 && (
                                    <div className="customer-section customer-bill">
                                        <div className="customer-section-title">Bill Details</div>
                                        <div className="customer-bill-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                                        <div className="customer-bill-row"><span>GST (5%)</span><span>₹{gst.toFixed(2)}</span></div>
                                        <div className="customer-bill-row total"><span>Total Amount</span><span>₹{total.toFixed(2)}</span></div>
                                    </div>
                                )}

                                {/* Payment Method */}
                                {cart.length > 0 && (
                                    <div className="customer-section">
                                        <div className="customer-section-title">Payment Method</div>
                                        <div className="customer-payment-methods">
                                            {['cash', 'upi', 'card'].map((m) => (
                                                <button
                                                    key={m}
                                                    className={`customer-payment-btn ${paymentMethod === m ? 'active' : ''}`}
                                                    onClick={() => setPaymentMethod(m)}
                                                >
                                                    <input type="radio" readOnly checked={paymentMethod === m} />
                                                    {m.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        {!orderSuccess && (
                            <div className="customer-drawer-footer">
                                <button
                                    className="customer-btn-primary"
                                    onClick={handlePlaceOrder}
                                    disabled={placing || cart.length === 0}
                                >
                                    {placing ? 'Placing Order...' : `Place Order • ₹${total.toFixed(2)}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sticky cart button (mobile friendly) */}
            {cartCount > 0 && !cartOpen && (
                <button className="customer-sticky-cart" onClick={() => setCartOpen(true)}>
                    <FiShoppingCart size={18} />
                    <span>{cartCount} item{cartCount !== 1 ? 's' : ''} — ₹{total.toFixed(0)}</span>
                    <span className="customer-sticky-cart-arrow">View Cart →</span>
                </button>
            )}
        </div>
    );
}
