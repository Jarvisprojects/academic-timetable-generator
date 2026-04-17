/**
 * Interactive Setup Wizard
 * Runs on first start to initialize admin account
 */

require('dotenv').config();
const readline = require('readline');
const pool = require('./models/db');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

async function checkAdminExists() {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM users WHERE is_admin = true'
        );
        return parseInt(result.rows[0].count) > 0;
    } catch (error) {
        return false;
    }
}

async function runSetupWizard() {
    try {
        const adminExists = await checkAdminExists();

        if (adminExists) {
            console.log('\n✅ Admin account already exists. Skipping setup.\n');
            rl.close();
            return true;
        }

        console.log('\n' + '='.repeat(60));
        console.log('  🎓 Academic Timetable Generator - Setup Wizard');
        console.log('='.repeat(60) + '\n');
        
        console.log('📝 Let\'s create your first admin account!\n');

        let username = '';
        let password = '';
        let confirmed = false;

        // Get username
        while (!username) {
            username = await question('👤 Admin Username: ');
            if (!username) {
                console.log('❌ Username cannot be empty');
            }
        }

        // Get password with confirmation
        while (!confirmed) {
            password = await question('🔐 Admin Password (min 8 chars): ');
            if (password.length < 8) {
                console.log('❌ Password must be at least 8 characters');
                password = '';
                continue;
            }

            const confirm = await question('🔐 Confirm Password: ');
            if (password !== confirm) {
                console.log('❌ Passwords do not match');
                password = '';
            } else {
                confirmed = true;
            }
        }

        // Create admin user
        console.log('\n🔑 Creating admin account...\n');
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4)',
            [username, `${username}@admin.local`, hash, true]
        );

        console.log('✅ Admin account created successfully!\n');
        console.log('   Username: ' + username);
        console.log('   Email: ' + username + '@admin.local');
        console.log('   Role: 👑 Admin\n');
        
        rl.close();
        return true;
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        rl.close();
        return false;
    }
}

module.exports = { runSetupWizard };
