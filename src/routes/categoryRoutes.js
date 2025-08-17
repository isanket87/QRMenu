const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// --- PUBLIC ROUTES ---

// Get public categories by user ID
router.get('/public/user/:userId', categoryController.getPublicCategoriesByUserId);

// Get all categories by the logged-in user without pagination
router.get('/all', protect, categoryController.getAllMyCategories);

// Get a single category by its ID
router.get('/:id', categoryController.getCategoryById);

// --- PROTECTED ROUTES ---

// Create - accessible by user or super_admin
router.post('/', protect, categoryController.createCategory);

// Get all categories by the logged-in user
router.get('/', protect, categoryController.getCategoriesByUserId);



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
    protect,
    authorizeRoles('admin','client', 'superadmin'),
    categoryController.getAdminCategoriesForUser // Reuses the existing controller logic
);


// Bulk update display order
router.put(
    '/bulk-update-order',
    protect,
    authorizeRoles('admin', 'client', 'superadmin'),
    categoryController.bulkUpdateCategoryDisplayOrder
);

// --- DYNAMIC ROUTES (PROTECTED) ---

// Update a category
router.put('/:id', protect, categoryController.updateCategory);

// Delete a category
router.delete('/:id', protect, categoryController.hardDeleteCategory);



module.exports = router;