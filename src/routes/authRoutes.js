// e:\QRMenu\src\routes\authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import protect
const authorizeRoles = require('../middleware/roleMiddleware');
const restaurantController = require('../controllers/restaurantController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Example admin-only route, ensure it's protected and has a handler
router.post(
    '/admin-only',
    protect,
    authorizeRoles('admin', 'super_admin'),
    (req, res) => {
        res.json({ message: 'Admin and Super Admin content accessible' });
    }
);

// Only allow admin or super_admin to create a restaurant
router.post(
    '/restaurant',
    protect, // Add protect middleware
    authorizeRoles('admin', 'super_admin'),
    restaurantController.createRestaurant
);

module.exports = router;