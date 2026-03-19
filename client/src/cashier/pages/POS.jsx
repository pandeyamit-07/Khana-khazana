import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { SkeletonGrid } from '../../components/SkeletonLoader';

const CATEGORY_ICONS = {
    'Refreshments': '🥤',
    'Breakfast': '🍳',
    'Pavbhaji': '🍛',
    'Frankie': '🌯',
    'Pizza': '🍕',
    'Sandwich': '🥪',
    'Burgers': '🍔',
    'Fries': '🍟',
    'Noodles': '🍜',
    'Desserts': '🍰',
    'Drinks': '🧃',
    'Thali': '🍱',
    'Rice': '🍚',
    'Roti': '🫓',
};

// Helper: resolve item image URL
// const getImageUrl = (item) => {
//     if (!item.image) return null;
//     // If it's an absolute URL already
//     if (item.image.startsWith('http')) return item.image;
//     // images/ prefix (seeded images)
//     if (item.image.startsWith('images/') || item.image.startsWith('/images/')) {
//         return item.image.startsWith('/') ? item.image : `/${item.image}`;
//     }
//     // uploads/ prefix (admin-uploaded images)
//     if (item.image.startsWith('uploads/') || item.image.startsWith('/uploads/')) {
//         return item.image.startsWith('/') ? item.image : `/${item.image}`;
//     }
//     // bare filename → assume /images/
//     return `/images/${item.image}`;
// };
const getImageUrl = (item) => {
    // 1. Path extract karein (item object ho ya string)
    const rawPath = typeof item === 'string' ? item : item?.image;
    if (!rawPath) return null;

    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    // 2. Path ko clean karein (Extra slashes aur duplicate "images" hatayein)
    // Hum sirf filename/folder wala part nikalenge
    let cleanPath = rawPath;
    
    // Agar path "/images/burger/cheese.jpeg" hai toh use "burger/cheese.jpeg" banayega
    if (cleanPath.startsWith('/images/')) {
        cleanPath = cleanPath.substring(8); 
    } else if (cleanPath.startsWith('images/')) {
        cleanPath = cleanPath.substring(7);
    }

    // 3. Final URL: baseUrl + /images/ + cleanPath
    // Result: https://...vercel.app/images/burger/cheese.jpeg
    return `${baseUrl}/images/${cleanPath}`;
};


export default function POS() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [orderItems, setOrderItems] = useState([]);
    const [orderType, setOrderType] = useState('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [placing, setPlacing] = useState(false);
    const [orderNote, setOrderNote] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch menu items
    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
    try {
        setLoading(true);
        const res = await api.get('/menu');
        
        // Ek hi baar data process karke set karein
        const items = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        
        setMenuItems(items);

        // Agar categories set karni hai to yahan items use karein (res.data nahi)
        if (items.length > 0) {
            const cats = [...new Set(items.map((item) => item.category))];
            setCategories(cats);
        }
    } catch (err) {
        console.error("Fetch Menu Error:", err);
        toast.error('Failed to load menu');
        setMenuItems([]); // Error case mein empty array set karein taaki .map fail na ho
    } finally {
        setLoading(false);
    }
};

    // Filter items by category
    const filteredItems = activeCategory === 'All' 
    ? (menuItems || []) 
    : (menuItems || []).filter((item) => item.category === activeCategory);
    // Add item to order
    const addToOrder = (item) => {
        if (item.quantity <= 0) {
            toast.error('Item out of stock');
            return;
        }
        setOrderItems((prev) => {
            const existing = prev.find((o) => o.menuItem === item._id);
            if (existing) {
                if (existing.qty >= item.quantity) {
                    toast.error(`Only ${item.quantity} available`);
                    return prev;
                }
                return prev.map((o) =>
                    o.menuItem === item._id ? { ...o, qty: o.qty + 1 } : o
                );
            }
            return [...prev, { menuItem: item._id, name: item.name, qty: 1, price: item.price }];
        });
    };

    // Update quantity
    const updateQty = (menuItemId, delta) => {
        setOrderItems((prev) =>
            prev
                .map((o) => (o.menuItem === menuItemId ? { ...o, qty: o.qty + delta } : o))
                .filter((o) => o.qty > 0)
        );
    };

    // Remove item
    const removeItem = (menuItemId) => {
        setOrderItems((prev) => prev.filter((o) => o.menuItem !== menuItemId));
    };

    // Calculations
    const subtotal = orderItems.reduce((sum, o) => sum + o.price * o.qty, 0);
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;

    // Place order and generate bill
    const handlePlaceOrder = async () => {
        if (orderItems.length === 0) {
            toast.error('Add items to your order');
            return;
        }
        if (!customerName.trim()) {
            toast.error('Customer name is required');
            return;
        }
        if (!customerMobile.trim()) {
            toast.error('Mobile number is required');
            return;
        }
        if (orderType === 'delivery' && !customerAddress.trim()) {
            toast.error('Delivery address is required');
            return;
        }

        setPlacing(true);
        try {
            await api.post('/orders', {
                type: orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
                items: orderItems,
                paymentMethod,
                customerName,
                customerMobile,
                customerAddress: orderType === 'delivery' ? customerAddress : undefined,
                note: orderNote || undefined,
            });
            toast.success('Order placed successfully!');

            // Generate and print bill
            const bill = `
═══════════════════════════════
    🍽️ KHANA khazana
    Restaurant & Cafe
═══════════════════════════════
Type: ${orderType.toUpperCase()}
${tableNumber && orderType === 'dine-in' ? `Table: ${tableNumber}` : ''}
${customerName ? `Customer: ${customerName}` : ''}
${customerMobile ? `Mobile: ${customerMobile}` : ''}
${customerAddress && orderType === 'delivery' ? `Address: ${customerAddress}` : ''}
${orderNote ? `Note: ${orderNote}` : ''}
───────────────────────────────
${orderItems.map((o) => `${o.name} x${o.qty}  ₹${(o.price * o.qty).toFixed(2)}`).join('\n')}
───────────────────────────────
Subtotal:  ₹${subtotal.toFixed(2)}
GST @5%:   ₹${gst.toFixed(2)}
TOTAL:     ₹${total.toFixed(2)}
Payment:   ${paymentMethod.toUpperCase()}
═══════════════════════════════
    Thank you for dining!
═══════════════════════════════
`;
            const win = window.open('', '_blank', 'width=400,height=600');
            win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;">${bill}</pre>`);
            win.document.close();
            win.print();
            win.onafterprint = () => {
                win.close();
                resetOrder();
            };
            setTimeout(() => {
                if (!win.closed) {
                    win.close();
                    resetOrder();
                }
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };

    const resetOrder = () => {
        setOrderItems([]);
        setTableNumber('');
        setCustomerName('');
        setCustomerMobile('');
        setCustomerAddress('');
        setOrderNote('');
        fetchMenu();
    };

    return (
        <div>
            <Navbar activePage="menu" />

            {/* POS LAYOUT */}
            <div className="pos-layout">
                {/* LEFT SIDEBAR - Categories */}
                <div className="sidebar-categories">
                    <div className="sidebar-title">Categories</div>
                    <button
                        className={`category-item ${activeCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('All')}
                    >
                        <span className="category-icon">📋</span> All Items
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            <span className="category-icon">{CATEGORY_ICONS[cat] || '🍴'}</span>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* CENTER - Menu Grid */}
                <div className="menu-section">
                    <div className="menu-header">
                        <h2>{activeCategory === 'All' ? 'All Menu Items' : activeCategory}</h2>
                        <span className="menu-count">{loading ? '...' : filteredItems.length} items</span>
                    </div>
                    {loading ? (
                        <SkeletonGrid count={9} type="menu" />
                    ) : (filteredItems?.length === 0 || !filteredItems) ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🍽️</div>
                            <h3>No items found</h3>
                            <p>No menu items in this category yet</p>
                        </div>
                    ) : (
                        <div className="menu-grid">
                            {filteredItems?.map((item) => {
                                const imgUrl = getImageUrl(item);
                                const inCart = orderItems.find((o) => o.menuItem === item._id);
                                return (
                                    <div
                                        key={item._id}
                                        className={`menu-card ${item.quantity <= 0 ? 'disabled' : ''}`}
                                        onClick={() => addToOrder(item)}
                                    >
                                        {/* Product image or emoji fallback */}
                                        <div className="menu-card-img-wrap">
                                            {imgUrl ? (
                                                <img
                                                    src={imgUrl}
                                                    alt={item.name}
                                                    className="menu-card-img"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="menu-card-icon"
                                                style={{ display: imgUrl ? 'none' : 'flex' }}
                                            >
                                                {CATEGORY_ICONS[item.category] || '🍴'}
                                            </div>
                                        </div>

                                        <div className="menu-card-name">{item.name}</div>
                                        {item.description && (
                                            <div className="menu-card-desc">{item.description}</div>
                                        )}
                                        <div className="menu-card-bottom">
                                            <span className="menu-card-price">₹{item.price}</span>
                                            <span className={`menu-card-qty ${item.quantity <= 0 ? 'out-of-stock' : ''}`}>
                                                {item.quantity <= 0 ? 'Out of Stock' : `Qty: ${item.quantity}`}
                                            </span>
                                        </div>
                                        {inCart && (
                                            <div className="menu-card-in-cart">
                                                ✓ {inCart.qty} in cart
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT - Order Panel */}
                <div className="order-panel">
                    <div className="order-panel-header">
                        <h3>🛒 Current Order</h3>
                        <div className="order-type-tabs">
                            {['dine-in', 'delivery', 'pickup'].map((type) => (
                                <button
                                    key={type}
                                    className={`order-type-tab ${orderType === type ? 'active' : ''}`}
                                    onClick={() => setOrderType(type)}
                                >
                                    {type === 'dine-in' ? 'Dine In' : type === 'delivery' ? 'Delivery' : 'Pick Up'}
                                </button>
                            ))}
                        </div>
                        {orderType === 'dine-in' && (
                            <div className="table-input">
                                <input
                                    type="text"
                                    placeholder="Table Number"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                />
                            </div>
                        )}
                        {orderType === 'delivery' && (
                            <div className="table-input">
                                <input
                                    type="text"
                                    placeholder="Delivery Address"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="order-items">
                        {orderItems.length === 0 ? (
                            <div className="order-empty">
                                <FiShoppingCart className="order-empty-icon" />
                                <p>No items added yet</p>
                            </div>
                        ) : (
                            orderItems.map((item) => (
                                <div key={item.menuItem} className="order-item">
                                    <div className="order-item-info">
                                        <div className="order-item-name">{item.name}</div>
                                        <div className="order-item-price">₹{item.price}</div>
                                    </div>
                                    <div className="qty-controls">
                                        <button className="qty-btn" onClick={() => updateQty(item.menuItem, -1)}>
                                            <FiMinus size={12} />
                                        </button>
                                        <span className="qty-value">{item.qty}</span>
                                        <button className="qty-btn" onClick={() => updateQty(item.menuItem, 1)}>
                                            <FiPlus size={12} />
                                        </button>
                                    </div>
                                    <span className="order-item-total">₹{(item.price * item.qty).toFixed(2)}</span>
                                    <button className="btn-remove" onClick={() => removeItem(item.menuItem)}>
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Order Footer */}
                    <div className="order-footer">
                        <div className="order-summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="order-summary-row">
                            <span>GST @5%</span>
                            <span>₹{gst.toFixed(2)}</span>
                        </div>
                        <div className="order-total-row">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        {/* Payment Methods */}
                        <div className="payment-methods">
                            {['cash', 'card', 'upi'].map((method) => (
                                <div className="payment-option" key={method}>
                                    <input
                                        type="radio"
                                        id={`pay-${method}`}
                                        name="payment"
                                        value={method}
                                        checked={paymentMethod === method}
                                        onChange={() => setPaymentMethod(method)}
                                    />
                                    <label htmlFor={`pay-${method}`}>{method.toUpperCase()}</label>
                                </div>
                            ))}
                        </div>

                        {/* Customer Info */}
                        <div className="customer-fields">
                            <input
                                type="text"
                                placeholder="Customer Name *"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Mobile Number *"
                                value={customerMobile}
                                onChange={(e) => setCustomerMobile(e.target.value)}
                                required
                            />
                            <textarea
                                placeholder="Order note (optional)"
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                maxLength={200}
                                rows={2}
                                style={{ resize: 'none', marginTop: '6px' }}
                            />
                        </div>

                        {/* Action Button */}
                        <div className="order-actions">
                            <button
                                className="btn-place-order"
                                onClick={handlePlaceOrder}
                                disabled={placing || orderItems.length === 0}
                            >
                                {placing ? 'Processing...' : '🛒 Place Order & Print Bill'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
