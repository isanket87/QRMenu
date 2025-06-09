// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const authRoutes = require('./routes/authRoutes'); // Import auth routes
const menuRoutes = require('./routes/menuRoutes');
// No need to explicitly import db.js here, as it connects automatically
// and its 'pool' instance is used directly by controllers.

const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all routes (important for front-end)
app.use(express.json()); // Parse JSON request bodies

// API Routes
app.use('/api/auth', authRoutes); // Add auth routes, prefixed with /api/auth
app.use('/api', menuRoutes); // All routes defined in menuRoutes will be prefixed with /api

// Basic route for testing server
app.get('/', (req, res) => {
    res.send('Restaurant Menu Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the menu: http://localhost:${PORT}/api/menu/1`);
});