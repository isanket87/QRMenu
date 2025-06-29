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
            (category_id, name, description, price, image_url, is_available, created_by, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [category_id || null, name, description || null, price, image_url || null, is_available ?? true, created_by, true]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating dish:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all menu items for a user (paginated, optionally filter by category or search by name)
exports.getDishes = async (req, res) => {
    const userId = req.user?.id;
    const { category_id, search } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }

    try {
        const conditions = [`created_by = $1`]; // Removed status condition
        const queryParams = [userId];
        let paramIndex = 2;

        if (category_id) {
            conditions.push(`category_id = $${paramIndex++}`);
            queryParams.push(category_id);
        }

        if (search) {
            conditions.push(`LOWER(name) LIKE $${paramIndex++}`);
            queryParams.push(`%${search.toLowerCase()}%`);
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const dishesQuery = `SELECT * FROM dishes ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const countQuery = `SELECT COUNT(*) FROM dishes ${whereClause}`;

        const dishesQueryParams = [...queryParams, limit, offset];
        const countQueryParams = [...queryParams];

        const [dishesResult, countResult] = await Promise.all([
            pool.query(dishesQuery, dishesQueryParams),
            pool.query(countQuery, countQueryParams)
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            data: dishesResult.rows,
            pagination: { currentPage: page, perPage: limit, totalItems, totalPages }
        });
    } catch (err) {
        console.error('Error fetching dishes:', err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching dishes.' });
    }
};

// Get ALL dishes for the logged-in user without pagination
exports.getAllMyDishes = async (req, res) => {
    const userId = req.user?.id;
    const { category_id, search } = req.query;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User not identified.' });
    }

    try {
        const conditions = [`created_by = $1`, `status = true`];
        const queryParams = [userId];
        let paramIndex = 2;

        if (category_id) {
            conditions.push(`category_id = $${paramIndex++}`);
            queryParams.push(category_id);
        }

        if (search) {
            conditions.push(`LOWER(name) LIKE $${paramIndex++}`);
            queryParams.push(`%${search.toLowerCase()}%`);
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const dishesQuery = `SELECT * FROM dishes ${whereClause} ORDER BY created_at DESC`;

        const dishesResult = await pool.query(dishesQuery, queryParams);

        res.json(dishesResult.rows);
    } catch (err) {
        console.error('Error fetching all dishes:', err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching all dishes.' });
    }
};

// Get all dishes for a specific category (paginated)
exports.getDishesByCategoryId = async (req, res) => {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required.' });
    }

    try {
        const conditions = [`category_id = $1`, `status = true`];
        const queryParams = [categoryId];
        let paramIndex = 2;

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const dishesQuery = `SELECT * FROM dishes ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const countQuery = `SELECT COUNT(*) FROM dishes ${whereClause}`;

        const dishesQueryParams = [...queryParams, limit, offset];
        const countQueryParams = [...queryParams];

        const [dishesResult, countResult] = await Promise.all([
            pool.query(dishesQuery, dishesQueryParams),
            pool.query(countQuery, countQueryParams)
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            data: dishesResult.rows,
            pagination: { currentPage: page, perPage: limit, totalItems, totalPages }
        });
    } catch (err) {
        console.error(`Error fetching dishes for category ${categoryId}:`, err.message, err.stack);
        res.status(500).json({ message: 'Server error while fetching dishes by category.' });
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
            `SELECT * FROM dishes WHERE created_by = $1 AND category_id IS NULL AND status = true`,
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
            `SELECT * FROM dishes WHERE id = $1`,
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
            `SELECT * FROM dishes WHERE created_by = $1 AND LOWER(name) = $2 AND status = true`,
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
            `SELECT * FROM dishes WHERE created_by = $1 AND status = true AND LOWER(name) LIKE $2`,
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
        image_url, is_available, status
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
                status = COALESCE($7, status),
                updated_by = $8,
                updated_at = NOW()
            WHERE id = $9 AND status = true
            RETURNING *`,
            [
                category_id,
                name,
                description,
                price,
                image_url,
                is_available,
                typeof status === 'boolean' ? status : null,
                updated_by,
                id
            ]
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
            `UPDATE dishes SET status = false, updated_by = $1, updated_at = NOW() WHERE id = $2 AND status = true RETURNING *`,
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