const pool = require('../config/db');

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
    const {
        name, address, description, opening_time, closing_time,
        type, food_type, phone_number, email, website, image_url
    } = req.body;
    const created_by = req.user?.id;

    if (!name || !address) {
        return res.status(400).json({ message: 'Name and address are required.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO restaurants
            (name, address, description, opening_time, closing_time, type, food_type, phone_number, email, website, image_url, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [name, address, description || null, opening_time, closing_time, type, food_type, phone_number, email, website, image_url, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating restaurant:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all active restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM restaurants WHERE status = 'active' ORDER BY id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching restaurants:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM restaurants WHERE id = $1 AND status = 'active'`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching restaurant:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search restaurants by name or address
exports.searchRestaurants = async (req, res) => {
    const { q } = req.query;
    try {
        const result = await pool.query(
            `SELECT * FROM restaurants WHERE status = 'active' AND (LOWER(name) LIKE $1 OR LOWER(address) LIKE $1)`,
            [`%${q?.toLowerCase() || ''}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching restaurants:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
    const { id } = req.params;
    const {
        name, address, description, opening_time, closing_time,
        type, food_type, phone_number, email, website, image_url
    } = req.body;
    const updated_by = req.user?.id;

    try {
        const result = await pool.query(
            `UPDATE restaurants SET
                name = COALESCE($1, name),
                address = COALESCE($2, address),
                description = COALESCE($3, description),
                opening_time = COALESCE($4, opening_time),
                closing_time = COALESCE($5, closing_time),
                type = COALESCE($6, type),
                food_type = COALESCE($7, food_type),
                phone_number = COALESCE($8, phone_number),
                email = COALESCE($9, email),
                website = COALESCE($10, website),
                image_url = COALESCE($11, image_url),
                updated_by = $12,
                updated_at = NOW()
            WHERE id = $13 AND status = 'active'
            RETURNING *`,
            [name, address, description, opening_time, closing_time, type, food_type, phone_number, email, website, image_url, updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found or already deleted' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating restaurant:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Soft delete restaurant
exports.softDeleteRestaurant = async (req, res) => {
    const { id } = req.params;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE restaurants SET status = 'deleted', updated_by = $1, updated_at = NOW() WHERE id = $2 AND status = 'active' RETURNING *`,
            [updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found or already deleted' });
        }
        res.json({ message: 'Restaurant deleted successfully.' });
    } catch (err) {
        console.error('Error deleting restaurant:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};