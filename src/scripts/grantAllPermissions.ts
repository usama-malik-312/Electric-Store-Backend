import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

async function grantAllPermissions() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('Granting all permissions to all roles...');

        // Insert all permission-role combinations
        const result = await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT 
                r.id AS role_id,
                p.id AS permission_id
            FROM roles r
            CROSS JOIN permissions p
            ON CONFLICT (role_id, permission_id) DO NOTHING
        `);

        console.log(`✓ Granted permissions to all roles`);

        // Get summary
        const summary = await client.query(`
            SELECT 
                r.name AS role_name,
                COUNT(rp.permission_id) AS permission_count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            GROUP BY r.id, r.name
            ORDER BY r.name
        `);

        console.log('\nPermission Summary:');
        console.log('-------------------');
        for (const row of summary.rows) {
            console.log(`${row.role_name}: ${row.permission_count} permissions`);
        }

        await client.query('COMMIT');
        console.log('\n✅ All permissions granted successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error granting permissions:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    grantAllPermissions()
        .then(() => {
            console.log('\nScript completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

export default grantAllPermissions;

