const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create
//router.post('/', authorizeRoles('admin', 'super_admin'), categoryController.createCategory);
router.post('/', categoryController.createCategory);

// Get all for a restaurant
router.get('/restaurant/:restaurant_id', categoryController.getCategoriesByRestaurant);

// Get by id
router.get('/:id', categoryController.getCategoryById);

// Get by name (query: ?restaurant_id=1&name=Starters)
router.get('/by-name', categoryController.getCategoryByName);

// Search (query: ?restaurant_id=1&q=star)
router.get('/search', categoryController.searchCategories);

// Update
//router.put('/:id', authorizeRoles('admin', 'super_admin'), categoryController.updateCategory);
router.put('/:id', categoryController.updateCategory);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'super_admin'), categoryController.softDeleteCategory);

module.exports = router;