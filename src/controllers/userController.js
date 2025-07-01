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
        city, state, country, role, isActive
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

    try {
        let baseQuery = 'FROM users';
        let whereClause = '';
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereClause = ` WHERE full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex}`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const usersResult = await pool.query(
            `SELECT ${userFieldsToReturn} ${baseQuery}${whereClause} ORDER BY id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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