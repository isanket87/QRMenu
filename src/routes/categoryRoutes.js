const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Create - accessible by user or super_admin
router.post('/', protect, authorizeRoles('admin','client', 'superadmin'), categoryController.createCategory);

// Get by name (query: ?restaurant_id=1&name=Starters)
router.get('/by-name', categoryController.getCategoryByName);

// Search (query: ?restaurant_id=1&q=star)
router.get('/search', categoryController.searchCategories);

// Get all categories by the logged-in user
router.get('/my-categories', protect, categoryController.getCategoriesByUserId);

// Get all categories by the logged-in user without pagination
router.get('/my-categories/all', protect, categoryController.getAllMyCategories);

// Get by id - This should come after more specific string routes
router.get('/:id', categoryController.getCategoryById);

// Get all categories for a specific user (super_admin access only)
router.get(
    '/admin/user/:userId/categories',
    authorizeRoles('super_admin'),
    categoryController.getAdminCategoriesForUser
);

// Get all categories for a specific user by their ID (admin or super_admin access)
router.get(
    '/by-user/:userId',
    authorizeRoles('admin','client', 'superadmin'), // Or adjust roles as needed
    categoryController.getAdminCategoriesForUser // Reuses the existing controller logic
);


// Bulk update display order
router.put(
    '/bulk-update-order',
    protect,
    categoryController.bulkUpdateCategoryDisplayOrder
);

// Update
router.put('/:id', protect, categoryController.updateCategory);

// Soft delete
router.delete('/:id', protect, categoryController.softDeleteCategory);



module.exports = router;