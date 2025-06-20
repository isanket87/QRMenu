const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create dish - accessible by admin or super_admin
router.post('/', authorizeRoles('admin', 'superadmin'), dishController.createDish);

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
router.put('/:id', authorizeRoles('admin', 'superadmin'), dishController.updateDish);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'superadmin'), dishController.softDeleteDish);

module.exports = router;