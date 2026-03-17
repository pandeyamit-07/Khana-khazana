Khana Khazana — POS Application Walkthrough
What Was Built
A full-stack MERN Restaurant POS application with:

Backend (/server) - Component	Files

Models	User.js (bcrypt hashing), MenuItem.js, Order.js (auto-increment order#)

Auth	JWT login/signup, protect + isAdmin middleware

APIs	/api/auth, /api/menu (CRUD + Multer upload), /api/orders, /api/inventory

Seed	seed.js — 30 sample items across 9 categories + admin/staff users


Frontend (/client)

Page	Features

Login / Signup	JWT auth, role selector, animated dark UI

POS (/)	Category sidebar, menu grid, order panel (Dine In/Delivery/Pick Up), GST @5%, payment methods, E-Bill print

Current Orders (/current-orders)	Filter by type, order cards with item tables, 10s polling, "Delivered" button

Inventory (/admin/inventory)	Admin-only, item cards with images, Add/Edit/Delete modals, FAB button


Design
Dark theme with red #e53e3e accent
Inter font, glassmorphism, hover animations, gradient buttons
Responsive for desktop and tablet

Project Structure
POS/
├── server/
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   ├── models/       (User, MenuItem, Order)
│   ├── controllers/  (auth, menu, order, inventory)
│   ├── routes/       (auth, menu, orders, inventory)
│   ├── middleware/    (auth.js — JWT + role check)
│   └── uploads/      (multer image storage)
└── client/
    ├── index.html
    ├── vite.config.js (proxy to :5000)
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── components/ProtectedRoute.jsx
        └── pages/ (Login, Signup, POS, CurrentOrders, admin/Inventory)


How to Run
Prerequisites

Node.js installed
MongoDB running locally on port 27017
Steps
bash

# 1. Seed the database (one time)
cd server
node seed.js

# 2. Start backend (Terminal 1)
cd server
node server.js

# 3. Start frontend (Terminal 2)
cd client
npm run dev
Then open http://localhost:3000

Login Credentials
Role	Email	Password

Admin	admin@khana.com   admin123
Staff	staff@khana.com   staff123


Verification Results
✅ Frontend builds successfully (Vite dist created)
✅ All 20+ source files created and consistent
⚠️ MongoDB was not running during testing — server requires MongoDB to start