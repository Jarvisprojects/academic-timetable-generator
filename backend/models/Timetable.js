const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

class Timetable {
    static async create(user_id, name, description, input_json) {
        const query = `
            INSERT INTO timetables (user_id, name, description, input_json, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING id
        `;
        const values = [user_id, name, description, input_json];
        const res = await pool.query(query, values);
        return res.rows[0].id;
    }

    static async findById(id) {
        const query = 'SELECT * FROM timetables WHERE id = $1';
        const res = await pool.query(query, [id]);
        return res.rows[0];
    }

    static async findByUserId(userId) {
        const query = 'SELECT * FROM timetables WHERE user_id = $1 ORDER BY created_at DESC';
        const res = await pool.query(query, [userId]);
        return res.rows;
    }

    static async update(id, updates) {
        const setClauses = [];
        const values = [];
        let idx = 1;
        for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`${key} = $${idx}`);
            values.push(value);
            idx++;
        }
        values.push(id);
        const query = `
            UPDATE timetables
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${idx}
            RETURNING *
        `;
        const res = await pool.query(query, values);
        return res.rows[0];
    }

    static async updateStatus(id, status, output_json = null, error_message = null) {
        const updates = { status };
        if (output_json !== null) updates.output_json = output_json;
        if (error_message !== null) updates.error_message = error_message;
        return await this.update(id, updates);
    }

    static async delete(id) {
        const query = 'DELETE FROM timetables WHERE id = $1';
        await pool.query(query, [id]);
    }
}

module.exports = Timetable;