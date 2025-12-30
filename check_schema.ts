import pool from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
    console.log('Checking schema...');
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role_id';
        `);
        console.log('Role_id column:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}
checkSchema();
