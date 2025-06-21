const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create - accessible by admin or super_admin
router.post('/', authorizeRoles('admin', 'superadmin'), restaurantController.createRestaurant);

// Get all
router.get('/', restaurantController.getAllRestaurants);

// Get by id
router.get('/:id', restaurantController.getRestaurantById);

// Search
router.get('/search', restaurantController.searchRestaurants);

// Update
router.put('/:id', authorizeRoles('admin', 'superadmin'), restaurantController.updateRestaurant);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'superadmin'), restaurantController.softDeleteRestaurant);

module.exports = router;