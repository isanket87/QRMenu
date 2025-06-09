// e:\QRMenu\src\models\userModel.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (userData) => {
    const { fullName, businessName, phoneNumber, email, password, city, state, country, role = 'user', status = 'active' } = userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await pool.query(
        `INSERT INTO users (full_name, business_name, phone_number, email, password, city, state, country, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, full_name, email, role, status`,
        [fullName, businessName, phoneNumber, email, hashedPassword, city, state, country, role, status]
    );
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const findUserById = async (id) => {
    const result = await pool.query('SELECT id, full_name, email, role, status FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
};