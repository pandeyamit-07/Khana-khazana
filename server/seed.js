// Seed script — populates menu items and creates default users.
// Run: node seed.js  (from the server/ directory)
// WARNING: clears existing MenuItem data (users are kept).
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');

const menuItems = [
    // ── Refreshments ──────────────────────────────────────────────
    { name: 'Shikanji', image: 'images/refreshments/shikanji.jpg', description: 'Indian lemonade', category: 'Refreshments', quantity: 100, price: 30 },
    { name: 'Blue Lagoon', image: 'images/refreshments/blue-lagoon.jpg', description: 'Vibrant blue lagoon', category: 'Refreshments', quantity: 100, price: 50 },
    { name: 'Chocolate Shake', image: 'images/refreshments/choclate.jpeg', description: 'Creamy chocolate flavor', category: 'Refreshments', quantity: 100, price: 79 },
    { name: 'Rose Milk', image: 'images/refreshments/rose.jpeg', description: 'Rose-flavored milkshake', category: 'Refreshments', quantity: 100, price: 45 },
    { name: 'Cold Coffee', image: 'images/1746520822360.jpeg', description: 'Refreshing cold coffee', category: 'Refreshments', quantity: 100, price: 50 },
    { name: 'Butterscotch Milkshake', image: 'images/1746520872027.jpeg', description: 'Butterscotch-flavored milkshake', category: 'Refreshments', quantity: 100, price: 60 },
    { name: 'Oreo Milkshake', image: 'images/refreshments/oreo.jpeg', description: 'Oreo-flavored milkshake', category: 'Refreshments', quantity: 100, price: 60 },
    { name: 'KitKat Milkshake', image: 'images/1746520882722.jpeg', description: 'KitKat-flavored milkshake', category: 'Refreshments', quantity: 100, price: 60 },

    // ── Breakfast ─────────────────────────────────────────────────
    { name: 'Coffee', image: 'images/breakfast/coffee.jpeg', description: 'A tight mood Refresher', category: 'Breakfast', quantity: 50, price: 35 },
    { name: 'Idli & Chatney', image: 'images/breakfast/idli.jpeg', description: 'Spicy with Sambhar', category: 'Breakfast', quantity: 50, price: 45 },
    { name: 'Mendu Vada', image: 'images/breakfast/mendu.jpeg', description: 'Spicy with Sambhar', category: 'Breakfast', quantity: 50, price: 45 },
    { name: 'Mumbai Poha', image: 'images/breakfast/poha.jpeg', description: 'Light with low oil Breakfast', category: 'Breakfast', quantity: 50, price: 35 },
    { name: 'Masala Tea', image: 'images/breakfast/tea.jpeg', description: 'A tight mood Refresher', category: 'Breakfast', quantity: 50, price: 25 },
    { name: 'Vada-Pav', image: 'images/breakfast/vadapav.jpg', description: 'Spicy usal with Pav & Chutney', category: 'Breakfast', quantity: 50, price: 25 },

    // ── Pav Bhaji ─────────────────────────────────────────────────
    { name: 'Pav Bhaji', image: 'images/pavbhaji/pavbhaji.jpg', description: 'Spicy and buttery bhaji with bread', category: 'Pavbhaji', quantity: 50, price: 100 },
    { name: 'Jain Pav Bhaji', image: 'images/pavbhaji/jain-pavbhaji.jpg', description: 'No-onion, no-garlic bhaji', category: 'Pavbhaji', quantity: 50, price: 100 },
    { name: 'Cheese Pav Bhaji', image: 'images/pavbhaji/cheesse-pavbhaji.jpg', description: 'Bhaji topped with cheese', category: 'Pavbhaji', quantity: 50, price: 130 },
    { name: 'Only Bhaji', image: 'images/pavbhaji/bhaji.jpeg', description: 'Bhaji without bread', category: 'Pavbhaji', quantity: 50, price: 100 },
    { name: 'Extra Butter Pav', image: 'images/pavbhaji/pav.jpeg', description: 'Pav with extra butter', category: 'Pavbhaji', quantity: 50, price: 30 },

    // ── Frankie ───────────────────────────────────────────────────
    { name: 'Veg Frankie', image: 'images/frankie/frankie.jpg', description: 'Delicious veg roll', category: 'Frankie', quantity: 100, price: 30 },
    { name: 'Schezwan Frankie', image: 'images/frankie/shejwan.jpg', description: 'Spicy schezwan roll', category: 'Frankie', quantity: 100, price: 40 },
    { name: 'Paneer Frankie', image: 'images/frankie/panner.jpeg', description: 'Paneer-filled roll', category: 'Frankie', quantity: 100, price: 45 },
    { name: 'Paneer Noodles Frankie', image: 'images/frankie/panner-noodle.jpeg', description: 'Paneer and noodles roll', category: 'Frankie', quantity: 100, price: 55 },
    { name: 'Schezwan Noodles Frankie', image: 'images/frankie/shezwan-noodles.jpeg', description: 'Schezwan and noodles roll', category: 'Frankie', quantity: 100, price: 60 },
    { name: 'Cheese Paneer Noodles Frankie', image: 'images/frankie/cheese-panner-noodle.jpeg', description: 'Cheese, paneer, and noodles roll', category: 'Frankie', quantity: 100, price: 75 },
    { name: 'Cheese Paneer Schezwan Mayo Noodles Frankie', image: 'images/frankie/panner-mayo.jpeg', description: 'Cheese, paneer, schezwan, mayo, and noodles roll', category: 'Frankie', quantity: 100, price: 85 },

    // ── Pizza ─────────────────────────────────────────────────────
    { name: 'Veg Cheese Pizza', image: 'images/pizza/cheese.jpeg', description: 'Classic veg cheese pizza', category: 'Pizza', quantity: 50, price: 100 },
    { name: 'Veg Cheese Paneer Pizza', image: 'images/pizza/cheese-panner.jpeg', description: 'Paneer-topped veg pizza', category: 'Pizza', quantity: 50, price: 120 },
    { name: 'Mushroom Pizza', image: 'images/pizza/mushroom.jpeg', description: 'Mushroom-topped pizza', category: 'Pizza', quantity: 50, price: 130 },
    { name: 'Babycorn Pizza', image: 'images/pizza/corn.jpeg', description: 'Pizza with babycorn topping', category: 'Pizza', quantity: 50, price: 130 },
    { name: 'Cheese Corn Pizza', image: 'images/pizza/cheese-corn.jpeg', description: 'Pizza with corn and cheese', category: 'Pizza', quantity: 50, price: 170 },
    { name: 'Maxican Pizza', image: 'images/pizza/mexican.jpg', description: 'Mexican-style pizza', category: 'Pizza', quantity: 50, price: 190 },
    { name: 'Maharaja Pizza', image: 'images/pizza/maharaja.jpeg', description: 'Loaded pizza with multiple toppings', category: 'Pizza', quantity: 50, price: 210 },

    // ── Sandwich ──────────────────────────────────────────────────
    { name: 'Veg Sandwich', image: 'images/sandiwch/sand.jpeg', description: 'Classic veg sandwich', category: 'Sandwich', quantity: 100, price: 40 },
    { name: 'Cheese Sandwich', image: 'images/sandiwch/cheese-sand.jpeg', description: 'Cheese-filled sandwich', category: 'Sandwich', quantity: 100, price: 50 },
    { name: 'Masala Toast', image: 'images/sandiwch/masala-toast.jpg', description: 'Spiced toast sandwich', category: 'Sandwich', quantity: 100, price: 50 },
    { name: 'Schezwan Cheese Toast', image: 'images/sandiwch/shezwan-cheese-toast.jpeg', description: 'Spicy schezwan toast', category: 'Sandwich', quantity: 100, price: 55 },
    { name: 'Veg Cheese Toast', image: 'images/sandiwch/cheese-toast.jpeg', description: 'Cheesy veg toast sandwich', category: 'Sandwich', quantity: 100, price: 55 },
    { name: 'Veg Cheese Grill', image: 'images/sandiwch/cheese-grill.jpeg', description: 'Grilled sandwich with veg and cheese', category: 'Sandwich', quantity: 100, price: 115 },
    { name: 'Veg Schezwan Grill', image: 'images/sandiwch/shejwan-grill.jpeg', description: 'Spicy schezwan grilled sandwich', category: 'Sandwich', quantity: 100, price: 120 },
    { name: 'Paneer Cheese Grill', image: 'images/sandiwch/paneer-grill.jpeg', description: 'Paneer-filled grilled sandwich with cheese', category: 'Sandwich', quantity: 100, price: 140 },

    // ── Burgers ───────────────────────────────────────────────────
    { name: 'Veg Burger', image: 'images/burger/veg.jpeg', description: 'Classic veggie burger', category: 'Burgers', quantity: 100, price: 50 },
    { name: 'Schezwan Burger', image: 'images/burger/shezwan.jpeg', description: 'Spicy schezwan burger', category: 'Burgers', quantity: 100, price: 55 },
    { name: 'Cheese Burger', image: 'images/burger/cheese.jpeg', description: 'Burger with melted cheese', category: 'Burgers', quantity: 100, price: 60 },
    { name: 'Paneer Burger', image: 'images/burger/panner.jpeg', description: 'Paneer-filled burger', category: 'Burgers', quantity: 100, price: 65 },
    { name: 'Cheese Paneer Burger', image: 'images/burger/cheese-panner.jpg', description: 'Cheese and paneer burger', category: 'Burgers', quantity: 100, price: 80 },
    { name: 'Double Decker Burger', image: 'images/burger/double.jpg', description: 'Two-layered burger', category: 'Burgers', quantity: 100, price: 85 },
    { name: 'Maharaja Burger', image: 'images/burger/maharaja.jpg', description: 'Loaded king-size burger', category: 'Burgers', quantity: 100, price: 90 },

    // ── Fries ─────────────────────────────────────────────────────
    { name: 'French Fries', image: 'images/fries/fries.jpg', description: 'Crispy golden fries', category: 'Fries', quantity: 50, price: 65 },
    { name: 'Peri Peri Fries', image: 'images/fries/peri.jpg', description: 'Fries with peri-peri seasoning', category: 'Fries', quantity: 50, price: 70 },
    { name: 'Overloaded Fries', image: 'images/fries/over.jpg', description: 'Loaded fries with toppings', category: 'Fries', quantity: 50, price: 75 },
    { name: 'Deep Fry French Fries', image: 'images/fries/deep.jpg', description: 'Crispy golden fries', category: 'Fries', quantity: 50, price: 65 },
    { name: 'Masala French Fries', image: 'images/fries/masala.jpg', description: 'Crispy spiced fries', category: 'Fries', quantity: 50, price: 65 },

    // ── Noodles ───────────────────────────────────────────────────
    { name: 'Veg Noodles', image: 'images/noodles/veg.jpg', description: 'Delicious stir-fried noodles with vegetables', category: 'Noodles', quantity: 50, price: 120 },
    { name: 'Schezwan Noodles', image: 'images/noodles/shejwan.jpg', description: 'Spicy noodles with schezwan sauce', category: 'Noodles', quantity: 50, price: 140 },
    { name: 'Hakka Noodles', image: 'images/noodles/hakka.jpg', description: 'Classic Chinese-style stir-fried noodles', category: 'Noodles', quantity: 50, price: 130 },
    { name: 'Paneer Noodles', image: 'images/noodles/panner.jpg', description: 'Noodles mixed with paneer cubes', category: 'Noodles', quantity: 50, price: 150 },
    { name: 'Cheese Noodles', image: 'images/noodles/cheese.jpg', description: 'Noodles topped with melted cheese', category: 'Noodles', quantity: 50, price: 160 },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Only clear menu items — keep existing users
        await MenuItem.deleteMany({});
        console.log('🗑️  Cleared existing menu items');

        await MenuItem.insertMany(menuItems);
        console.log(`🌱 Seeded ${menuItems.length} menu items`);

        // Create default users only if they don't exist
        const adminExists = await User.findOne({ email: 'admin@khana.com' });
        if (!adminExists) {
            await User.create({ name: 'Admin', email: 'admin@khana.com', password: 'admin123', role: 'admin' });
            console.log('👤 Admin user created: admin@khana.com / admin123');
        } else {
            console.log('👤 Admin user already exists — skipped');
        }

        const staffExists = await User.findOne({ email: 'staff@khana.com' });
        if (!staffExists) {
            await User.create({ name: 'Staff User', email: 'staff@khana.com', password: 'staff123', role: 'staff' });
            console.log('👤 Staff user created: staff@khana.com / staff123');
        } else {
            console.log('👤 Staff user already exists — skipped');
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('─────────────────────────────────────');
        console.log('Admin:  admin@khana.com  / admin123');
        console.log('Staff:  staff@khana.com  / staff123');
        console.log('─────────────────────────────────────');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
