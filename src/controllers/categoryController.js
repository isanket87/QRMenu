const pool = require('../config/db');

// Create a new category
exports.createCategory = async (req, res) => {
    const { restaurant_id, name, description, display_order } = req.body;
    const created_by = req.user?.id;
    // if (!restaurant_id || !name) {
    //     return res.status(400).json({ message: 'restaurant_id and name are required.' });
    // }
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

// Bulk update display order for categories
exports.bulkUpdateCategoryDisplayOrder = async (req, res) => {
    const categoryUpdates = req.body; // Expecting an array: [{ id: 1, display_order: 0 }, ...]
    const updated_by = req.user?.id;

    if (!updated_by) {
        // This should ideally be caught by the 'protect' middleware,
        // but it's a good safeguard.
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }

    if (!Array.isArray(categoryUpdates) || categoryUpdates.length === 0) {
        return res.status(400).json({ message: 'Request body must be a non-empty array of category updates.' });
    }

    const validationErrors = [];
    for (let i = 0; i < categoryUpdates.length; i++) {
        const update = categoryUpdates[i];
        if (typeof update.id !== 'number' || update.id <= 0) {
            validationErrors.push(`Item at index ${i}: 'id' must be a positive number.`);
        }
        if (typeof update.display_order !== 'number' || update.display_order < 0) {
            validationErrors.push(`Item at index ${i}: 'display_order' must be a non-negative number.`);
        }
    }

    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Invalid category update data.', errors: validationErrors });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const resultsOfSuccessfulUpdates = [];
        let successfullyUpdatedCount = 0;

        for (const update of categoryUpdates) {
            const result = await client.query(
                `UPDATE categories
                 SET display_order = $1, updated_by = $2, updated_at = NOW()
                 WHERE id = $3 AND status = 'active'
                 RETURNING *`, // Returns all fields of the updated row
                [update.display_order, updated_by, update.id]
            );

            if (result.rowCount > 0) {
                successfullyUpdatedCount++;
                resultsOfSuccessfulUpdates.push(result.rows[0]);
            }
        }

        await client.query('COMMIT');

        res.status(200).json(resultsOfSuccessfulUpdates);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error bulk updating category display order:', err.message, err.stack);
        res.status(500).json({ message: 'Server error during bulk update.' });
    } finally {
        client.release();
    }
};

// Get all categories created by a specific user
exports.getCategoriesByUserId = async (req, res) => {
    const userId = req.user?.id; // Get user ID from the authenticated user

    // This check is mostly a safeguard. The `protect` middleware applied
    // at the router level in server.js should ensure req.user and req.user.id exist.
    // If not, `protect` would typically send a 401 before reaching here.
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE created_by = $1 AND status = 'active' ORDER BY display_order ASC, id ASC`,
            [userId]
        );
        res.json(result.rows); // Uses the responseFormatter middleware
    } catch (err) {
        console.error('Error fetching categories by user ID:', err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching user categories.' });
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
        console.error('Error updating:', err.message, err.stack);
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

// Get all categories for a specific user (super_admin access)
exports.getAdminCategoriesForUser = async (req, res) => {
    const { userId } = req.params; // Get target user ID from route parameters

    if (!userId) {
        // This check might be redundant if the route enforces userId param,
        // but good for robustness.
        return res.status(400).json({ message: 'Target User ID is required in the path.' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE created_by = $1 AND status = 'active' ORDER BY display_order ASC, id ASC`,
            [userId]
        );
        res.json(result.rows); // Returns an empty array if no categories found for the user
    } catch (err) {
        console.error('Error fetching categories for user by admin:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};