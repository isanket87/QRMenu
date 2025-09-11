const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Define a common list of user fields to return, excluding sensitive ones
const userFieldsToReturn = 'id, full_name, business_name, phone_number, email, city, state, country, role, status, created_at, updated_at, qr_code_url';

// Add a new user (admin/super_admin only)
exports.addUser = async (req, res) => {
    const {
        fullName, businessName, phoneNumber, email, password,
        city, state, country, role = 'user', isActive = true
    } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role.toUpperCase(); // Convert role to uppercase
        const result = await pool.query(
            `INSERT INTO users 
            (full_name, business_name, phone_number, email, password, city, state, country, role, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${userFieldsToReturn}`,
            [fullName, businessName, phoneNumber, email, hashedPassword, city, state, country, userRole, isActive]
        );
        // The RETURNING clause already selected the safe fields
        if (result.rows.length > 0) {
            res.status(201).json(result.rows[0]);
        } else {
            res.status(400).json({ error: 'User creation failed, no data returned.' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update user by ID
exports.updateUser = async (req, res) => {
    const id = req.params.id;
    const {
        fullName, businessName, phoneNumber, email, password,
        city, state, country, role, isActive, status // Accept status from body
    } = req.body;
    try {
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Only include fields that are provided (not undefined)
        const fields = {};
        if (fullName !== undefined) fields.full_name = fullName;
        if (businessName !== undefined) fields.business_name = businessName;
        if (phoneNumber !== undefined) fields.phone_number = phoneNumber;
        if (email !== undefined) fields.email = email;
        if (city !== undefined) fields.city = city;
        if (state !== undefined) fields.state = state;
        if (country !== undefined) fields.country = country;
        if (isActive !== undefined) fields.status = isActive;
        if (status !== undefined) fields.status = status; // Allow direct status update
        if (role !== undefined) fields.role = role.toUpperCase();
        if (hashedPassword) fields.password = hashedPassword;

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ error: 'No fields provided for update.' });
        }

        const setClauses = Object.keys(fields).map((key, index) => `${key}=$${index + 1}`).join(', ');
        const values = Object.values(fields);

        const result = await pool.query(
            `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id=$${values.length + 1} RETURNING ${userFieldsToReturn}`,
            [...values, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.message = 'User updated successfully';
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]); // Only need to confirm deletion
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.message = 'User deleted successfully';
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
    const currentPage = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.limit, 10) || 10;
    const offset = (currentPage - 1) * perPage;
    const search = req.query.search || '';
    const { sortBy, sortOrder } = req.query;

    try {
        let baseQuery = 'FROM users';
        // Exclude SUPER_ADMIN from the list of users that can be managed here.
        let whereClause = " WHERE role != 'superadmin'";
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // --- Sorting Logic ---
        // Whitelist columns to prevent SQL injection
        const allowedSortBy = ['id', 'full_name', 'business_name', 'email','city','state','country' ,'role', 'status', 'created_at'];
        const validSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const validSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderByClause = `ORDER BY ${validSortBy} ${validSortOrder}, id ASC`;

        const usersResult = await pool.query(
            `SELECT ${userFieldsToReturn} ${baseQuery}${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...queryParams, perPage, offset]
        );
        const countResult = await pool.query(
            `SELECT COUNT(*) ${baseQuery}${whereClause}`,
            queryParams
        );
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / perPage);
        res.json({
            data: usersResult.rows,
            pagination: {
                currentPage,
                perPage,
                totalItems,
                totalPages
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT ${userFieldsToReturn} FROM users WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get dashboard stats for the logged-in user
exports.getUserDashboardStats = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        // This check is slightly redundant if `protect` middleware is used, but good for safety
        return res.status(401).json({ error: 'Unauthorized: User not identified.' });
    }

    try {
        // Query for active category count
        const categoryCountQuery = pool.query(
            `SELECT COUNT(*) FROM categories WHERE created_by = $1 AND status = true`,
            [userId]
        );

        // Query for active dish count
        const dishCountQuery = pool.query(
            `SELECT COUNT(*) FROM dishes WHERE created_by = $1 AND status = true`,
            [userId]
        );

        // Query for recent 5 dishes, including category name for context
        const recentDishesQuery = pool.query(
            `SELECT d.*, c.name as category_name
             FROM dishes d
             LEFT JOIN categories c ON d.category_id = c.id
             WHERE d.created_by = $1
             ORDER BY d.created_at DESC
             LIMIT 5`,
            [userId]
        );

        // Execute all queries in parallel for efficiency
        const [categoryCountResult, dishCountResult, recentDishesResult] =
            await Promise.all([categoryCountQuery, dishCountQuery, recentDishesQuery]);

        const categorycount = parseInt(categoryCountResult.rows[0].count, 10);
        const fooditemcount = parseInt(dishCountResult.rows[0].count, 10);
        const recent_food_item = recentDishesResult.rows;

        res.json({ categorycount, fooditemcount, recent_food_item });
    } catch (err) {
        console.error('Error fetching user dashboard stats:', err.message, err.stack);
        res.status(500).json({ error: 'Server error while fetching dashboard stats.' });
    }
};

// Get admin dashboard stats (user count and recent users)
exports.getAdminDashboardStats = async (req, res) => {
    try {
        // Query for total user count
        const userCountQuery = pool.query("SELECT COUNT(*) FROM users WHERE role = 'CLIENT'");

        // Query for the 5 most recent users, returning only safe fields
        const recentUsersQuery = pool.query(
            `SELECT ${userFieldsToReturn} FROM users 
             WHERE role = 'client' 
             ORDER BY created_at DESC LIMIT 5`
        );

        // Execute all queries in parallel for efficiency
        const [userCountResult, recentUsersResult] = await Promise.all([
            userCountQuery,
            recentUsersQuery,
        ]);

        const userCount = parseInt(userCountResult.rows[0].count, 10);
        const recentUsers = recentUsersResult.rows;

        res.json({ userCount, recentUsers });
    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err.message, err.stack);
        res.status(500).json({ error: 'Server error while fetching admin dashboard stats.' });
    }
};