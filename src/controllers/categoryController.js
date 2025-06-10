const pool = require('../config/db');

// Create a new category
exports.createCategory = async (req, res) => {
    const { restaurant_id, name, description, display_order } = req.body;
    const created_by = req.user?.id;
    if (!restaurant_id || !name) {
        return res.status(400).json({ message: 'restaurant_id and name are required.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO categories (restaurant_id, name, description, display_order, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [restaurant_id, name, description || null, display_order || 0, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories for a restaurant
exports.getCategoriesByRestaurant = async (req, res) => {
    const { restaurant_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE restaurant_id = $1 AND status = 'active' ORDER BY display_order ASC, id ASC`,
            [restaurant_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching categories:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE id = $1 AND status = 'active'`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching category by id:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get category by name (for a restaurant)
exports.getCategoryByName = async (req, res) => {
    const { restaurant_id, name } = req.query;
    if (!restaurant_id || !name) {
        return res.status(400).json({ message: 'restaurant_id and name are required.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE restaurant_id = $1 AND LOWER(name) = $2 AND status = 'active'`,
            [restaurant_id, name.toLowerCase()]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching category by name:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search categories by name (for a restaurant)
exports.searchCategories = async (req, res) => {
    const { restaurant_id, q } = req.query;
    if (!restaurant_id) {
        return res.status(400).json({ message: 'restaurant_id is required.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE restaurant_id = $1 AND status = 'active' AND LOWER(name) LIKE $2 ORDER BY display_order ASC, id ASC`,
            [restaurant_id, `%${q?.toLowerCase() || ''}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error searching categories:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, display_order } = req.body;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE categories SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                display_order = COALESCE($3, display_order),
                updated_by = $4,
                updated_at = NOW()
            WHERE id = $5 AND status = 'active'
            RETURNING *`,
            [name, description, display_order, updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found or already deleted' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Soft delete category
exports.softDeleteCategory = async (req, res) => {
    const { id } = req.params;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE categories SET status = 'deleted', updated_by = $1, updated_at = NOW() WHERE id = $2 AND status = 'active' RETURNING *`,
            [updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found or already deleted' });
        }
        res.json({ message: 'Category deleted successfully.' });
    } catch (err) {
        console.error('Error deleting category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};