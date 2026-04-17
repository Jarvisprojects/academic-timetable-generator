/**
 * Database Initialization Script
 * Sets up PostgreSQL database and user if they don't exist
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    // Connect as default postgres connection via Unix socket
    const adminClient = new Client({
        user: 'postgres',
        database: 'postgres',
    });

    try {
        console.log('🔗 Connecting to PostgreSQL...');
        await adminClient.connect();
        console.log('✅ Connected to PostgreSQL\n');

        // Create user if it doesn't exist
        console.log('👤 Creating database user...');
        try {
            await adminClient.query(`
                CREATE USER timetable_user WITH PASSWORD 'timetable_password';
            `);
            console.log('✅ Created user: timetable_user\n');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('ℹ️  User already exists\n');
            } else {
                throw e;
            }
        }

        // Create database if it doesn't exist
        console.log('🗄️  Creating database...');
        try {
            await adminClient.query(`
                CREATE DATABASE timetable_db OWNER timetable_user;
            `);
            console.log('✅ Created database: timetable_db\n');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('ℹ️  Database already exists\n');
            } else {
                throw e;
            }
        }

        await adminClient.end();

        // Now connect as timetable_user to initialize schema
        const dbClient = new Client({
            host: 'localhost',
            port: 5432,
            user: 'timetable_user',
            password: 'timetable_password',
            database: 'timetable_db',
        });

        console.log('🔗 Connecting to timetable_db...');
        await dbClient.connect();
        console.log('✅ Connected to timetable_db\n');

        // Read and execute init.sql
        console.log('📋 Initializing database schema...');
        const initSqlPath = path.join(__dirname, 'init.sql');
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        
        await dbClient.query(initSql);
        console.log('✅ Database schema initialized\n');

        await dbClient.end();

        console.log('🎉 Database initialization complete!');
        console.log('\n📝 Connection details:');
        console.log('   Host: localhost');
        console.log('   Port: 5432');
        console.log('   User: timetable_user');
        console.log('   Password: timetable_password');
        console.log('   Database: timetable_db\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during database initialization:');
        console.error(error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n⚠️  PostgreSQL is not running. Please start it:');
            console.error('   sudo service postgresql start');
        }
        
        process.exit(1);
    }
}

initializeDatabase();
