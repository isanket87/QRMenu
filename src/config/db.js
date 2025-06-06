// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test the database connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        return;
    }
    console.log('Successfully connected to the PostgreSQL database!');
    client.release(); // Release the client back to the pool
});

module.exports = pool;