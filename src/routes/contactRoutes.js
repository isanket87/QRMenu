const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post('/', contactController.submitContactForm);

// @route   GET /api/contact
// @desc    Get all contact form submissions (for admins)
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'superadmin'), contactController.getAllSubmissions);

module.exports = router;