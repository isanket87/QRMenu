const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create
//router.post('/', authorizeRoles('admin', 'super_admin'), restaurantController.createRestaurant);

router.post('/', restaurantController.createRestaurant);

// Get all
router.get('/', restaurantController.getAllRestaurants);

// Get by id
router.get('/:id', restaurantController.getRestaurantById);

// Search
router.get('/search', restaurantController.searchRestaurants);

// Update
router.put('/:id', authorizeRoles('admin', 'super_admin'), restaurantController.updateRestaurant);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'super_admin'), restaurantController.softDeleteRestaurant);

module.exports = router;