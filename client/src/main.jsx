import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import CashierApp from './cashier/CashierApp';
import CustomerApp from './customer/CustomerApp';
import './index.css';

// Route to the correct app based on URL prefix.
// /cashier/* → Cashier panel (staff, protected by login)
// /*         → Customer panel (public)
const isCashier = window.location.pathname.startsWith('/cashier');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isCashier ? (
            <BrowserRouter basename="/cashier">
                <AuthProvider>
                    <CashierApp />
                </AuthProvider>
            </BrowserRouter>
        ) : (
            <BrowserRouter basename="/">
                <CustomerApp />
            </BrowserRouter>
        )}
    </React.StrictMode>
);
