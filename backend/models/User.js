const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

class User {
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const res = await pool.query(query, [username]);
        return res.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const res = await pool.query(query, [id]);
        return res.rows[0];
    }

    static async findAll() {
        const query = 'SELECT * FROM users ORDER BY created_at DESC';
        const res = await pool.query(query);
        return res.rows;
    }

    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password_hash);
    }

    static async create({ username, email, password, is_admin = false }) {
        const hash = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (username, email, password_hash, is_admin)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [username, email, hash, is_admin];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async update(id, { username, email, password }) {
        let query = 'UPDATE users SET username = $1, email = $2';
        const values = [username, email];
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query += ', password_hash = $3';
            values.push(hash);
        }
        query += ' WHERE id = $' + (values.length + 1) + ' RETURNING *';
        values.push(id);
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1';
        await pool.query(query, [id]);
    }
}

module.exports = User;