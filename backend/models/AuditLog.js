const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

class AuditLog {
    static async create({ user_id, action, target_user_id, target_username, actor_username, old_data, new_data }) {
        const query = `
            INSERT INTO audit_log (user_id, target_user_id, actor_username, target_username, action, old_data, new_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [user_id, target_user_id, actor_username, target_username, action, old_data, new_data];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async findAll() {
        const query = `SELECT * FROM audit_log ORDER BY created_at DESC`;
        const res = await pool.query(query);
        return res.rows;
    }

    static async clearAll() {
        const query = 'DELETE FROM audit_log';
        await pool.query(query);
    }
}

module.exports = AuditLog;