// src/controllers/menuController.js
const pool = require('../config/db');

// Get menu for a specific restaurant
exports.getRestaurantMenu = async (req, res) => {
    const restaurantId = req.params.restaurantId;
    console.log("request is arrived")
    try {
        // Fetch restaurant details
        const restaurantResult = await pool.query(
            'SELECT id, name, address, description FROM restaurants WHERE id = $1',
            [restaurantId]
        );

        console.debug(restaurantResult);
        if (restaurantResult.rows.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurant = restaurantResult.rows[0];

        // Fetch categories for the restaurant
        const categoriesResult = await pool.query(
            'SELECT id, name, description, display_order FROM categories WHERE restaurant_id = $1 ORDER BY display_order ASC',
            [restaurantId]
        );
        const categories = categoriesResult.rows;

        // Fetch dishes for each category
        const menu = await Promise.all(
            categories.map(async (category) => {
                const dishesResult = await pool.query(
                    'SELECT id, name, description, price, image_url, is_available FROM dishes WHERE category_id = $1 ORDER BY name ASC',
                    [category.id]
                );
                return {
                    ...category,
                    dishes: dishesResult.rows,
                };
            })
        );

        res.json({
            restaurant,
            menu,
        });

    } catch (err) {
        console.log(err);
        console.error('Error fetching restaurant menu:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all dishes
exports.getAllDishes = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, price, image_url, is_available, category_id FROM dishes ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dishes:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// You can add more controllers here, e.g., to get all restaurants, add a new dish, etc.