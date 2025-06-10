// e:\QRMenu\src\routes\authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const authorizeRoles = require('../middleware/roleMiddleware');
const restaurantController = require('../controllers/restaurantController');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/admin-only', authorizeRoles('admin', 'super_admin'));

// Only allow admin or super_admin to create a restaurant
router.post(
    '/restaurant',
    authorizeRoles('admin', 'super_admin'),
    restaurantController.createRestaurant
);

module.exports = router;