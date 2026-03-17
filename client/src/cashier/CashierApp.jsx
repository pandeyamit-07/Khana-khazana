import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import POS from './pages/POS';
import CurrentOrders from './pages/CurrentOrders';
import Inventory from './pages/admin/Inventory';
import OrderHistory from './pages/OrderHistory';
import Dashboard from './pages/admin/Dashboard';
import LowStock from './pages/admin/LowStock';

function CashierApp() {
    const { user } = useAuth();

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: 'rgba(255, 255, 255, 0.92)',
                        color: '#1a1a2e',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 0, 0, 0.15)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        fontFamily: "'Times New Roman', Times, serif",
                    },
                    success: {
                        iconTheme: { primary: '#ff0000', secondary: '#fff' },
                    },
                }}
            />
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <POS />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/current-orders"
                    element={
                        <ProtectedRoute>
                            <CurrentOrders />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/order-history"
                    element={
                        <ProtectedRoute>
                            <OrderHistory />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/inventory"
                    element={
                        <AdminRoute>
                            <Inventory />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <Dashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/low-stock"
                    element={
                        <AdminRoute>
                            <LowStock />
                        </AdminRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </>
    );
}

export default CashierApp;
