// src/routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Define a route to get the menu for a specific restaurant
// Example: GET /api/menu/1 (for restaurant with ID 1)
router.get('/menu/:restaurantId', menuController.getRestaurantMenu);

// Route to get all dishes
router.get('/dishes', menuController.getAllDishes);

module.exports = router;