const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, true) RETURNING id, username, email',
            ['admin', 'admin@example.com', hash]
        );
        console.log('✅ Admin user created:', result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            console.log('ℹ️ Admin user already exists');
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        await pool.end();
    }
}

createAdmin();
