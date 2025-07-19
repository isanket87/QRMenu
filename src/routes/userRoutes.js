const express = require('express');
const userController = require('../controllers/userController');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// User management routes (admin/super_admin only)
router.post(
    '/',
    //authorizeRoles('admin', 'super_admin'), // It's good practice to keep this uncommented for security
    userController.addUser
);

router.put(
    '/:id',
    userController.updateUser
);

router.delete(
    '/:id',
    userController.deleteUser
);

router.get(
    '/',
    userController.getAllUsers // Supports pagination (e.g., ?page=1&limit=10) and search (e.g., ?q=searchTerm)
);



// This new route is for any logged-in user to get their own stats.
// The `protect` middleware should be applied in server.js for all /api/user routes.
router.get('/dashboard-stats', userController.getUserDashboardStats);

// New route for admin dashboard stats
router.get(
    '/admin/dashboard-stats',
    authorizeRoles('admin', 'superadmin'),
    userController.getAdminDashboardStats
);

// Get user by ID (admin/super_admin only)
router.get(
    '/:id',
    userController.getUserById
);

module.exports = router;