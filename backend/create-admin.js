/**
 * Create Admin User Script
 * 
 * Usage: 
 *   node backend/create-admin.js [username] [password]
 *   node backend/create-admin.js admin admin123
 */

require('dotenv').config();
const pool = require('./models/db');
const bcrypt = require('bcrypt');

async function createAdmin(username, password) {
    try {
        console.log('\n🔑 Creating Admin User...\n');

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            console.log(`❌ Error: User "${username}" already exists!`);
            process.exit(1);
        }

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, `${username}@admin.local`, hash, true]
        );

        console.log('✅ Admin user created successfully!\n');
        console.log('   Username:', result.rows[0].username);
        console.log('   Email:', result.rows[0].email);
        console.log('   Is Admin:', result.rows[0].is_admin);
        console.log('\n');

        pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:');
        console.error(error.message);
        console.error('\nMake sure:');
        console.error('  1. Database is running and accessible');
        console.error('  2. tables have been initialized (run: psql ... < init.sql)');
        console.error('  3. .env file is configured correctly');
        process.exit(1);
    }
}

// Get username and password from command line arguments
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

console.log('\n📝 Creating admin account with:');
console.log(`   Username: ${username}`);
console.log(`   Password: ${password}`);
console.log('');

createAdmin(username, password);
