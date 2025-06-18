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
    authorizeRoles('admin', 'super_admin'),
    userController.updateUser
);

router.delete(
    '/:id',
    authorizeRoles('admin', 'super_admin'),
    userController.deleteUser
);

router.get(
    '/',
    authorizeRoles('admin', 'super_admin'),
    userController.getAllUsers // Supports pagination (e.g., ?page=1&limit=10) and search (e.g., ?q=searchTerm)
);

// Get user by ID (admin/super_admin only)
router.get(
    '/:id',
    authorizeRoles('admin', 'super_admin'),
    userController.getUserById
);

module.exports = router;