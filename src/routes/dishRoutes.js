const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { protect } = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES ---

// Get public dishes by a specific user ID
router.get('/public/user/:userId', dishController.getPublicDishesByUserId);

// Get independent dishes (no category)
router.get('/independent', dishController.getIndependentDishes);

// Get all dishes for a specific category (paginated)
router.get('/category/:categoryId', dishController.getDishesByCategoryId);

// --- PROTECTED ROUTES ---

// Create dish for the logged-in user
router.post('/', protect, dishController.createDish);

// Get all dishes for the logged-in user (paginated, optionally filter by category)
router.get('/', protect, dishController.getDishes);

// Get all dishes for the logged-in user without pagination
router.get('/all', protect, dishController.getAllMyDishes);

// --- DYNAMIC ROUTES (MUST BE LAST) ---

// Get a single dish by its ID (publicly accessible)
router.get('/:id', dishController.getDishById);

// Update a dish
router.put('/:id', protect, dishController.updateDish);

// Delete a dish
router.delete('/:id', protect, dishController.hardDeleteDish);

module.exports = router;