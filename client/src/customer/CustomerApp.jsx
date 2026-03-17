import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CustomerMenu from './pages/CustomerMenu';

function CustomerApp() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#1a1a2e',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 90, 30, 0.2)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        fontFamily: "'Inter', sans-serif",
                    },
                    success: { iconTheme: { primary: '#ff5a1e', secondary: '#fff' } },
                }}
            />
            <Routes>
                <Route path="/" element={<CustomerMenu />} />
                <Route path="*" element={<CustomerMenu />} />
            </Routes>
        </>
    );
}

export default CustomerApp;
