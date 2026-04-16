const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Handle pool errors to prevent unhandled rejections
pool.on('error', (err) => {
    console.error('Unexpected connection pool error:', err);
});

module.exports = pool;