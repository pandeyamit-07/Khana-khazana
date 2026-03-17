const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories,
} = require('../controllers/menuController');
const { protect, isAdmin } = require('../middleware/auth');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /api/menu/categories/all — must come before /:id
router.get('/categories/all', getCategories);

// GET /api/menu
router.get('/', getMenuItems);

// GET /api/menu/:id
router.get('/:id', getMenuItem);

// POST /api/menu (admin, with image upload)
router.post('/', protect, isAdmin, upload.single('image'), createMenuItem);

// PUT /api/menu/:id (admin, with image upload)
router.put('/:id', protect, isAdmin, upload.single('image'), updateMenuItem);

// DELETE /api/menu/:id (admin)
router.delete('/:id', protect, isAdmin, deleteMenuItem);

module.exports = router;
