const pool = require('../config/db');

// Add a new user (admin/super_admin only)
exports.addUser = async (req, res) => {
    const {
        fullName, businessName, phoneNumber, email, password,
        city, state, country, role = 'user', isActive = true
    } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO users 
            (fullName, businessName, phoneNumber, email, password, city, state, country, role, "isActive") 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [fullName, businessName, phoneNumber, email, password, city, state, country, role, isActive]
        );
        res.status(201).json(result.rows[0]);
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
        const result = await pool.query(
            `UPDATE users SET 
                fullName=$1, businessName=$2, phoneNumber=$3, email=$4, password=$5, 
                city=$6, state=$7, country=$8, role=$9, "isActive"=$10
             WHERE id=$11 RETURNING *`,
            [fullName, businessName, phoneNumber, email, password, city, state, country, role, isActive, id]
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
        const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING *', [id]);
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
            'SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2',
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
            `SELECT * FROM users WHERE 
                fullName ILIKE $1 OR email ILIKE $1`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};