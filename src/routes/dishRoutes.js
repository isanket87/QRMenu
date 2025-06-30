const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dishController');
const { protect } = require('../middleware/authMiddleware');

// Create dish for the logged-in user
router.post('/', protect, dishController.createDish);

// Get all dishes for the logged-in user (paginated, optionally filter by category)
router.get('/', protect, dishController.getDishes);

// Get all dishes for the logged-in user without pagination
router.get('/all', protect, dishController.getAllMyDishes);

// Get independent dishes (no category)
router.get('/independent', dishController.getIndependentDishes);

// Get by id
router.get('/:id', dishController.getDishById);

// Get all dishes for a specific category (paginated)
router.get('/category/:categoryId', dishController.getDishesByCategoryId);

// Update
router.put('/:id', protect, dishController.updateDish);

// Soft delete
router.delete('/:id', protect, dishController.hardDeleteDish);

module.exports = router;