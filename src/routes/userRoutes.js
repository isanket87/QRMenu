const express = require('express');
const userController = require('../controllers/userController');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// User management routes (admin/super_admin only)
router.post(
    '/',
    //authorizeRoles('admin', 'super_admin'),
    userController.addUser
);

router.put(
    '/:id',
  //  authorizeRoles('admin', 'super_admin'),
    userController.updateUser
);

router.delete(
    '/:id',
//    authorizeRoles('admin', 'super_admin'),
    userController.deleteUser
);

router.get(
    '/',
    //authorizeRoles('admin', 'super_admin'),
    userController.getAllUsers // Supports pagination via query params: ?page=1&limit=10
);

router.get(
    '/search',
    //authorizeRoles('admin', 'super_admin'),
    userController.searchUsers // Supports search via query param: ?q=searchTerm
);

module.exports = router;