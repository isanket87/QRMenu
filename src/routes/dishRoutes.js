const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create dish
//router.post('/', authorizeRoles('admin', 'super_admin'), dishController.createDish);
router.post('/', dishController.createDish);

// Get all dishes for a restaurant (optionally filter by category)
router.get('/', dishController.getDishes);

// Get independent dishes (no category)
router.get('/independent', dishController.getIndependentDishes);

// Get by id
router.get('/:id', dishController.getDishById);

// Get by name (query: ?restaurant_id=1&name=Pizza)
router.get('/by-name', dishController.getDishByName);

// Search (query: ?restaurant_id=1&q=pizza)
router.get('/search', dishController.searchDishes);

// Update
router.put('/:id', authorizeRoles('admin', 'super_admin'), dishController.updateDish);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'super_admin'), dishController.softDeleteDish);

module.exports = router;