// e:\QRMenu\src\controllers\authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel'); // Ensure userModel is imported
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const { encrypt } = require('../Utils/cryptoUtils'); // Corrected path to lowercase 'utils'
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
        return res.status(400).json({ message: errors[0] });
    }

    try {
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const newUser = await userModel.createUser({
            fullName, businessName, phoneNumber, email, password, city, state, country, role: (role || 'user').toUpperCase()
        });

        // --- QR Code Generation and Cloudinary Upload ---
        if (newUser && newUser.id) {
            // Encrypt the user ID to use in the URL
            const encryptedUserId = encrypt(newUser.id.toString());

            // Construct the URL that the QR code will point to.
            // The URL now contains the encrypted user ID.
            console.log(encryptedUserId)
            const userMenuUrl = ` https://qa-menu-admin-panel.vercel.app/${encryptedUserId}`;
            let qrCodeUrl = null;

            try {
                // Generate QR code from the user's unique menu URL
                const qrCodeDataUrl = await QRCode.toDataURL(userMenuUrl);

                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(qrCodeDataUrl, {
                    folder: `qrmenu/user_qrcodes`, // Optional: organize uploads in a specific folder
                    public_id: `user_${newUser.id}_qr`, // Optional: unique public ID for easy retrieval
                    overwrite: true // Overwrite if a QR code for this user already exists
                });

                qrCodeUrl = uploadResult.secure_url;
                console.log(`QR Code uploaded to Cloudinary for user ${newUser.id}: ${qrCodeUrl}`);
                await userModel.updateUserQrCode(newUser.id, qrCodeUrl); // Store the URL in the database
            } catch (qrError) {
                console.error(`Error generating or uploading QR code for user ${newUser.id}:`, qrError.message);
                // Log the error but don't prevent user registration from succeeding
            }
        }
        // --- End QR Code Logic ---
        res.message = 'User created successfully';
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

        // Prevent inactive users from logging in
        if (user.status !== true) {
            return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email ,qu_url: user.qr_code_url, role: user.role.toUpperCase() } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

module.exports = { register, login };