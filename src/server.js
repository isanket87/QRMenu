// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Load environment variables from .env

const authRoutes = require('./routes/authRoutes'); // Import auth routes
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dishRoutes = require('./routes/dishRoutes'); // Import dish routes
const restaurantRoutes = require('./routes/restaurantRoutes'); // Import restaurant routes
// No need to explicitly import db.js here, as it connects automatically
// and its 'pool' instance is used directly by controllers.

const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(cors({
    origin: ['https://your-frontend.com'],
    credentials: true
})); // Enable CORS for all routes (important for front-end)
app.use(express.json()); // Parse JSON request bodies
app.use(helmet()); // Secure HTTP headers

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use(limiter);

app.use('/api/auth', authRoutes); // Add auth routes, prefixed with /api/auth
app.use('/api', menuRoutes); // All routes defined in menuRoutes will be prefixed with /api
app.use('/api/categories', categoryRoutes); // Add category routes, prefixed with /api/categories
app.use('/api/dishes', dishRoutes);
app.use('/api/restaurants', restaurantRoutes);

app.get('/', (req, res) => {
    res.send('Restaurant Menu Backend is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the menu: http://localhost:${PORT}/api/menu/1`);
});