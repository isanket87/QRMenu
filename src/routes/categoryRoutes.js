const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create - accessible by user or super_admin
router.post('/', authorizeRoles('admin','user', 'super_admin'), categoryController.createCategory);

// Get all for a restaurant
router.get('/restaurant/:restaurant_id', categoryController.getCategoriesByRestaurant);

// Get by id
router.get('/:id', categoryController.getCategoryById);

// Get by name (query: ?restaurant_id=1&name=Starters)
router.get('/by-name', categoryController.getCategoryByName);

// Search (query: ?restaurant_id=1&q=star)
router.get('/search', categoryController.searchCategories);

// Get all categories by the logged-in user
router.get('/my-categories', categoryController.getCategoriesByUserId);

// Get all categories for a specific user (super_admin access only)
router.get(
    '/admin/user/:userId/categories',
    authorizeRoles('super_admin'),
    categoryController.getAdminCategoriesForUser
);

// Get all categories for a specific user by their ID (admin or super_admin access)
router.get(
    '/by-user/:userId',
    authorizeRoles('admin', 'super_admin'), // Or adjust roles as needed
    categoryController.getAdminCategoriesForUser // Reuses the existing controller logic
);

// Update
router.put('/:id', authorizeRoles('admin', 'super_admin'), categoryController.updateCategory);

// Soft delete
router.delete('/:id', authorizeRoles('admin', 'super_admin'), categoryController.softDeleteCategory);

module.exports = router;