const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Define a common list of user fields to return, excluding sensitive ones
const userFieldsToReturn = 'id, full_name, business_name, phone_number, email, city, state, country, role, status, created_at, updated_at';

// Add a new user (admin/super_admin only)
exports.addUser = async (req, res) => {
    const {
        fullName, businessName, phoneNumber, email, password,
        city, state, country, role = 'user', isActive = true
    } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const result = await pool.query(
            `INSERT INTO users 
            (full_name, business_name, phone_number, email, password, city, state, country, role, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${userFieldsToReturn}`,
            [fullName, businessName, phoneNumber, email, hashedPassword, city, state, country, role, isActive ? 'active' : 'inactive']
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
        city, state, country, role, isActive
    } = req.body;
    try {
        let hashedPassword;
        if (password) { // Only hash password if it's being updated
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Build the query and parameters dynamically to only update password if provided
        const fields = { full_name: fullName, business_name: businessName, phone_number: phoneNumber, email, city, state, country, role, status: isActive ? 'active' : 'inactive' };
        if (hashedPassword) {
            fields.password = hashedPassword;
        }

        const setClauses = Object.keys(fields).map((key, index) => `${key}=$${index + 1}`).join(', ');
        const values = Object.values(fields);

        const result = await pool.query(
            `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id=$${values.length + 1} RETURNING ${userFieldsToReturn}`,
            [...values, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        // The RETURNING clause already selected the safe fields
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found or update failed.' });
        }
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
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
    const loggedInUserRole = req.user?.role;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';

    const conditions = [];
    const queryParams = []; // Parameters for the WHERE clause
    let paramIndex = 1;

    // Role-based filtering
    if (loggedInUserRole === 'admin') {
        // Admins see other 'admin' and 'user' roles.
        conditions.push(`role IN ($${paramIndex++}, $${paramIndex++})`);
        queryParams.push('admin', 'user');
    } else if (loggedInUserRole === 'super_admin') {
        // Super admins see all users. No specific role filter added here.
    } else {
        // This case should ideally be prevented by route-level authorization.
        // If a role without explicit permission reaches here, return empty.
        return res.json({
            users: [],
            pagination: { total: 0, page, pages: 0 }
        });
    }

    // Search query filtering
    if (searchQuery) {
        // The same parameter $${paramIndex} is used for both full_name and email ILIKE
        conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery}%`);
        paramIndex++; // Increment after adding the parameter to queryParams
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const usersQueryString = `SELECT ${userFieldsToReturn} FROM users ${whereClause} ORDER BY id LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const usersQueryParams = [...queryParams, limit, offset]; // Add limit and offset for the main query

    const countQueryString = `SELECT COUNT(*) FROM users ${whereClause}`;
    // countQueryParams are the same as queryParams for the WHERE clause (no limit/offset)
    const countQueryParams = [...queryParams];

    try {
        const usersResult = await pool.query(usersQueryString, usersQueryParams);
        const countResult = await pool.query(countQueryString, countQueryParams);

        const total = parseInt(countResult.rows[0].count, 10);
        let numPages = 0;
        if (total > 0) {
            numPages = (limit > 0) ? Math.ceil(total / limit) : 1;
        }

        res.json({
            users: usersResult.rows,
            pagination: {
                total,
                page,
                pages: numPages
            }
        });
    } catch (err) {
        console.error('Error in getAllUsers:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to retrieve users.' });
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