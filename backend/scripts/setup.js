const readline = require('readline');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function prompt(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function setup() {
    console.log('🚀 Setting up database...');
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                department_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Timetables table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS timetables (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                input_json JSONB NOT NULL,
                output_json JSONB,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Audit log table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                actor_username TEXT,
                target_username TEXT,
                action VARCHAR(50) NOT NULL,
                old_data JSONB,
                new_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Tables created/verified.');

        // Check if any admin exists
        const adminCheck = await pool.query('SELECT id, username FROM users WHERE is_admin = true LIMIT 1');
        if (adminCheck.rows.length > 0) {
            console.log('ℹ️ Admin already exists. Skipping creation.');
        } else {
            const username = await prompt('Enter admin username: ');
            const email = await prompt('Enter admin email: ');
            const password = await prompt('Enter admin password: ');
            const hash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, true) RETURNING id, username',
                [username, email, hash]
            );
            const admin = result.rows[0];
            console.log('✅ Admin user created.');
        }
    } catch (err) {
        console.error('❌ Setup failed:', err);
    } finally {
        await pool.end();
        rl.close();
    }
}

setup();