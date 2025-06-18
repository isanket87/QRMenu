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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const usersResult = await pool.query(
            `SELECT ${userFieldsToReturn} FROM users ORDER BY id LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const countResult = await pool.query('SELECT COUNT(*) FROM users');
        const total = parseInt(countResult.rows[0].count, 10);
        res.json({
            users: usersResult.rows,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Search users by name or email
exports.searchUsers = async (req, res) => {
    const q = req.query.q || '';
    try {
        const result = await pool.query(
            `SELECT ${userFieldsToReturn} FROM users WHERE
                full_name ILIKE $1 OR email ILIKE $1 ORDER BY id`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};