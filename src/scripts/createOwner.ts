// src/scripts/createOwner.ts
import pool from '../config/db';
import { hashPassword } from '../utils/auth';

async function createOwner() {
    try {
        const hashedPassword = await hashPassword('admin');

        await pool.query(
            `INSERT INTO users (email, password, role, is_verified) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE 
       SET password = EXCLUDED.password, role = EXCLUDED.role`,
            ['owner@email.com', hashedPassword, 'owner', true]
        );

        console.log('✅ Owner user created/updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating owner:', error);
        process.exit(1);
    }
}

createOwner();