const pool = require('../config/db');

// Create a new category
exports.createCategory = async (req, res) => {
    const { restaurant_id, name, description, display_order } = req.body;
    const created_by = req.user?.id;
    try {
        const result = await pool.query(
            `INSERT INTO categories (name, description, display_order, created_by, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, description || null, display_order || 0, created_by, true]
        );
        res.message = 'Category created successfully';
        res.status(201).json({
                data: result.rows[0]
            });
    } catch (err) {
        console.error('Error creating category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk update display order for categories
exports.bulkUpdateCategoryDisplayOrder = async (req, res) => {
    const categoryUpdates = req.body;
    const updated_by = req.user?.id;

    if (!updated_by) {
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
        return res.status(400).json({ message:  validationErrors[0] });
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
                 WHERE id = $3 AND status = true
                 RETURNING *`,
                [update.display_order, updated_by, update.id]
            );

            if (result.rowCount > 0) {
                successfullyUpdatedCount++;
                resultsOfSuccessfulUpdates.push(result.rows[0]);
            }
        }

        await client.query('COMMIT');
        res.message = 'Category updated successfully';

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
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }

    const currentPage = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.limit, 10) || 10;
    const offset = (currentPage - 1) * perPage;
    const searchQuery = req.query.search || '';
    const { sortBy, sortOrder } = req.query;


    try {
        const conditions = [`created_by = $1`]; // Removed status condition
        const queryParams = [userId];
        let paramIndex = 2;

        if (searchQuery) {
            conditions.push(`LOWER(name) LIKE $${paramIndex++}`);
            queryParams.push(`%${searchQuery.toLowerCase()}%`);
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        // --- Sorting Logic ---
        // Whitelist columns to prevent SQL injection
        const allowedSortBy = ['name', 'display_order', 'created_at', 'status'];
        const validSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'display_order';
        const validSortOrder = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const orderByClause = `ORDER BY ${validSortBy} ${validSortOrder}, id ASC`;

        const categoriesQuery = `SELECT * FROM categories ${whereClause} ${orderByClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const countQuery = `SELECT COUNT(*) FROM categories ${whereClause}`;

        const categoriesQueryParams = [...queryParams, perPage, offset];
        const countQueryParams = [...queryParams];

        const [categoriesResult, countResult] = await Promise.all([
            pool.query(categoriesQuery, categoriesQueryParams),
            pool.query(countQuery, countQueryParams)
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / perPage);

        res.json({
            data: categoriesResult.rows,
            pagination: {
                currentPage,
                perPage,
                totalItems,
                totalPages
            }
        });
    } catch (err) {
        console.error('Error fetching categories by user ID:', err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching user categories.' });
    }
};

// Get ALL categories for the logged-in user without pagination
exports.getAllMyCategories = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE created_by = $1 AND status = true ORDER BY display_order ASC, id ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all categories for logged-in user:', err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching all user categories.' });
    }
};

// Get all categories for a restaurant
exports.getCategoriesByRestaurant = async (req, res) => {
    const { restaurant_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM categories WHERE restaurant_id = $1 AND status = true ORDER BY display_order ASC, id ASC`,
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
            `SELECT * FROM categories WHERE id = $1`,
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
            `SELECT * FROM categories WHERE restaurant_id = $1 AND LOWER(name) = $2 AND status = true`,
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
            `SELECT * FROM categories WHERE restaurant_id = $1 AND status = true AND LOWER(name) LIKE $2 ORDER BY display_order ASC, id ASC`,
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
    const { name, description, display_order, status } = req.body;
    const updated_by = req.user?.id;
    try {
        const result = await pool.query(
            `UPDATE categories SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                display_order = COALESCE($3, display_order),
                status = COALESCE($4, status),
                updated_by = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *`,
            [name, description, display_order, typeof status === 'boolean' ? status : null, updated_by, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.message = 'Category updated successfully';
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating:', err.message, err.stack);
        console.error('Error updating category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Soft delete category
// exports.softDeleteCategory = async (req, res) => {
//     const { id } = req.params;
//     const updated_by = req.user?.id;
//     try {
//         const result = await pool.query(
//             `UPDATE categories SET status = false, updated_by = $1, updated_at = NOW() WHERE id = $2 AND status = true RETURNING *`,
//             [updated_by, id]
//         );
//         if (result.rows.length === 0) {
//             return res.status(404).json({ message: 'Category not found or already deleted' });
//         }
//         res.json({ message: 'Category deleted successfully.' });
//     } catch (err) {
//         console.error('Error deleting category:', err.message);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// Hard delete category
exports.hardDeleteCategory = async (req, res) => {
    const { id } = req.params;
    const deleted_by = req.user?.id;
    try {
        // Optionally, you can check if the category exists before deleting
        const checkResult = await pool.query(
            `SELECT * FROM categories WHERE id = $1`,
            [id]
        );
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Perform hard delete
        await pool.query(
            `DELETE FROM categories WHERE id = $1`,
            [id]
        );
            res.message = 'User deleted successfully';
        res.json({ message: 'Category permanently deleted.' });
    } catch (err) {
        console.error('Error hard deleting category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all categories for a specific user (super_admin access)
exports.getAdminCategoriesForUser = async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!userId) {
        return res.status(400).json({ message: 'Target User ID is required in the path.' });
    }

    try {
        const categoriesQuery = `SELECT * FROM categories WHERE created_by = $1 AND status = true ORDER BY display_order ASC, id ASC LIMIT $2 OFFSET $3`;
        const countQuery = `SELECT COUNT(*) FROM categories WHERE created_by = $1 AND status = true`;

        const [categoriesResult, countResult] = await Promise.all([
            pool.query(categoriesQuery, [userId, limit, offset]),
            pool.query(countQuery, [userId])
        ]);

        const total = parseInt(countResult.rows[0].count, 10);
        const pages = Math.ceil(total / limit);

        res.json({
            data: categoriesResult.rows,
            pagination: {
                total,
                page,
                pages
            }
        });
    } catch (err) {
        console.error('Error fetching categories for user by admin:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
