import fs from 'fs';
import path from 'path';
import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    console.log('Starting migration...');
    const client = await pool.connect();
    try {
        const migrationPath = path.join(__dirname, 'src/migrations/001_create_roles_permissions.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log(`Executing migration from ${migrationPath}...`);
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Migration executed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
