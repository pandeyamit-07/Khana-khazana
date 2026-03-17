import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import {
    FiGrid, FiClipboard, FiLogOut,
    FiClock, FiBox, FiChevronDown, FiUser, FiBarChart2,
    FiAlertTriangle
} from 'react-icons/fi';

const LS_KEY = 'pos_seen_order_ids';

export default function Navbar({ activePage }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [hasNewOrder, setHasNewOrder] = useState(false);
    const dropdownRef = useRef(null);

    // ── Close dropdown on outside click ───────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── When Current Orders page is active: mark all orders seen ──
    useEffect(() => {
        if (activePage === 'current-orders') {
            api.get('/orders', { params: { status: 'pending' } })
                .then((res) => {
                    const ids = res.data.map((o) => o._id).join(',');
                    localStorage.setItem(LS_KEY, ids);
                    setHasNewOrder(false);
                })
                .catch(() => { });
        }
    }, [activePage]);

    // ── Poll for new orders every 15 s ────────────────────────────
    const checkNewOrders = useCallback(async () => {
        try {
            const res = await api.get('/orders', { params: { status: 'pending' } });
            const currentIds = res.data.map((o) => o._id);
            const seenRaw = localStorage.getItem(LS_KEY) || '';
            const seenIds = seenRaw ? seenRaw.split(',') : [];
            setHasNewOrder(currentIds.some((id) => !seenIds.includes(id)));
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        checkNewOrders();
        const interval = setInterval(checkNewOrders, 15000);
        return () => clearInterval(interval);
    }, [checkNewOrders]);

    // ── Poll for low-stock every 30 s (admin only) ────────────────
    useEffect(() => {
        if (user?.role !== 'admin') return;
        const check = async () => {
            try {
                const res = await api.get('/menu');
                setLowStockCount(res.data.filter((i) => i.quantity < 10).length);
            } catch { }
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleNav = (path) => { setDropdownOpen(false); navigate(path); };
    const isAdmin = user?.role === 'admin';

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="brand-icon">🍽️</span>
                <span>Khana khazana</span>
            </div>

            <div className="nav-tabs">
                {/* Menu */}
                <button
                    className={`nav-tab ${activePage === 'menu' ? 'active' : ''}`}
                    onClick={() => navigate('/')}
                >
                    <FiGrid size={14} /> Menu
                </button>

                {/* Current Orders — green dot for new orders */}
                <button
                    className={`nav-tab ${activePage === 'current-orders' ? 'active' : ''}`}
                    onClick={() => navigate('/current-orders')}
                    style={{ position: 'relative' }}
                >
                    <FiClipboard size={14} /> Current Orders
                    {hasNewOrder && <span className="new-order-dot" />}
                </button>

                {/* Low Stock — admin only, numbered red badge */}
                {isAdmin && (
                    <button
                        className={`nav-tab low-stock-tab ${activePage === 'low-stock' ? 'active' : ''}`}
                        onClick={() => navigate('/admin/low-stock')}
                    >
                        <FiAlertTriangle size={14} /> Low Stock
                        {lowStockCount > 0 && (
                            <span className="low-stock-badge">{lowStockCount}</span>
                        )}
                    </button>
                )}
            </div>

            {/* Profile avatar + dropdown */}
            <div className="nav-user" ref={dropdownRef}>
                <div className="nav-user-trigger" onClick={() => setDropdownOpen((p) => !p)}>
                    <span className="nav-user-name">{user?.name}</span>
                    <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                    <FiChevronDown
                        size={13}
                        style={{
                            marginLeft: '2px',
                            transition: 'transform 0.2s',
                            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'var(--text-secondary)',
                        }}
                    />
                </div>

                {dropdownOpen && (
                    <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                            <div className="profile-dropdown-avatar"><FiUser size={20} /></div>
                            <div>
                                <div className="profile-dropdown-name">{user?.name}</div>
                                <div className="profile-dropdown-role">
                                    {isAdmin ? 'Administrator' : 'Staff'}
                                </div>
                            </div>
                        </div>
                        <div className="profile-dropdown-divider" />
                        <button
                            className={`profile-dropdown-item ${activePage === 'order-history' ? 'active' : ''}`}
                            onClick={() => handleNav('/order-history')}
                        >
                            <FiClock size={15} /> Order History
                        </button>
                        {isAdmin && (
                            <button
                                className={`profile-dropdown-item ${activePage === 'dashboard' ? 'active' : ''}`}
                                onClick={() => handleNav('/admin/dashboard')}
                            >
                                <FiBarChart2 size={15} /> Dashboard
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className={`profile-dropdown-item ${activePage === 'inventory' ? 'active' : ''}`}
                                onClick={() => handleNav('/admin/inventory')}
                            >
                                <FiBox size={15} /> Inventory
                            </button>
                        )}
                        <div className="profile-dropdown-divider" />
                        <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                            <FiLogOut size={15} /> Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
