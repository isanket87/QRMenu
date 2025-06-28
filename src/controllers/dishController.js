const pool = require('../config/db');

// Create a menu item (with or without category)
exports.createDish = async (req, res) => {
    const {
        category_id, name, description, price,
        image_url, is_available
    } = req.body;
    const created_by = req.user?.id;
    if (!name || !price) {
        return res.status(400).json({ message: 'Name and price are required.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO dishes
            (category_id, name, description, price, image_url, is_available, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [category_id || null, name, description || null, price, image_url || null, is_available ?? true, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all menu items for a user (optionally filter by category)
exports.getDishes = async (req, res) => {
    const { userId, category_id } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    try {
        let query = `SELECT * FROM dishes WHERE created_by = $1 AND status = 'active'`;
        let params = [userId];
        if (category_id) {
            query += ` AND category_id = $2`;
            params.push(category_id);
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching dishes:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get independent menu items (no category) for a user
exports.getIndependentDishes = async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM dishes WHERE created_by = $1 AND category_id IS NULL AND status = 'active'`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching independent dishes:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dish by ID
exports.getDishById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM dishes WHERE id = $1 AND status = 'active'`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching dish by id:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dish by name (for a user)
exports.getDishByName = async (req, res) => {
    const { userId, name } = req.query;
    if (!userId || !name) {
        return res.status(400).json({ message: 'userId and name are required.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM dishes WHERE created_by = $1 AND LOWER(name) = $2 AND status = 'active'`,
            [userId, name.toLowerCase()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Dish not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching dish by name:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search dishes by name (for a user)
exports.searchDishes = async (req, res) => {
    const { userId, q } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM dishes WHERE created_by = $1 AND status = 'active' AND LOWER(name) LIKE $2`,
            [userId, `%${q?.toLowerCase() || ''}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching dishes:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update dish
exports.updateDish = async (req, res) => {
    const { id } = req.params;
    const {
        category_id, name, description, price,
        image_url, is_available
    } = req.body;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE dishes SET
                category_id = COALESCE($1, category_id),
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                price = COALESCE($4, price),
                image_url = COALESCE($5, image_url),
                is_available = COALESCE($6, is_available),
                updated_by = $7,
                updated_at = NOW()
            WHERE id = $8 AND status = 'active'
            RETURNING *`,
            [category_id, name, description, price, image_url, is_available, updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Dish not found or already deleted' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Soft delete dish
exports.softDeleteDish = async (req, res) => {
    const { id } = req.params;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE dishes SET status = 'deleted', updated_by = $1, updated_at = NOW() WHERE id = $2 AND status = 'active' RETURNING *`,
            [updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Dish not found or already deleted' });
        }
        res.json({ message: 'Dish deleted successfully.' });
    } catch (err) {
        console.error('Error deleting dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};