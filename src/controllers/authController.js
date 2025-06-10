// e:\QRMenu\src\controllers\authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    const { fullName, businessName, phoneNumber, email, password, city, state, country, role } = req.body;

    // More specific validation
    const errors = [];
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
        errors.push('Full name is required and must be a non-empty string.');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('A valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('Password is required and must be at least 6 characters long.');
    }
    if (phoneNumber && (typeof phoneNumber !== 'string' || phoneNumber.trim() === '')) {
        // Basic check, can be enhanced with regex for specific formats
        errors.push('Phone number, if provided, must be a valid string.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed.', errors });
    }

    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const newUser = await userModel.createUser({
            fullName, businessName, phoneNumber, email, password, city, state, country, role: role || 'user'
        });

        // Respond with a success message instead of token and user details
        res.status(201).json({ message: 'User registered successfully. Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // PostgreSQL unique_violation error code
            if (error.constraint === 'users_email_key') { // Common constraint name for unique email
                return res.status(400).json({ message: 'This email address is already registered.' });
            }
            if (error.constraint === 'users_phone_number_key') {
                return res.status(400).json({ message: 'This phone number is already registered.' });
            }
            // Fallback for other unique constraints not explicitly handled
            return res.status(400).json({ message: 'A value provided is already in use. Please check your input.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const errors = [];
    if (!email || typeof email !== 'string' || email.trim() === '') {
        errors.push('Email is required.');
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
        errors.push('Password is required.');
    }
    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed.', errors });
    }

    try {
        const user = await userModel.findUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

module.exports = { register, login };