import pool from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

interface Module {
    name: string;
    actions: string[];
}

const modules: Module[] = [
    { name: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'brands', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'stores', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'item_groups', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'pos', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'roles', actions: ['create', 'read', 'update', 'delete'] },
];

async function seedRolesAndPermissions() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Create roles
        console.log('Creating roles...');
        const roles = [
            { name: 'owner', description: 'System owner with full access', isSystem: true },
            { name: 'admin', description: 'Administrator with full access', isSystem: true },
            { name: 'manager', description: 'Manager with limited administrative access', isSystem: false },
            { name: 'staff', description: 'Staff member with read-only and POS access', isSystem: false },
        ];

        const roleIds: Record<string, number> = {};

        for (const role of roles) {
            const result = await client.query(
                `INSERT INTO roles (name, description, is_system) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                 RETURNING id`,
                [role.name, role.description, role.isSystem]
            );
            roleIds[role.name] = result.rows[0].id;
            console.log(`✓ Created/Updated role: ${role.name}`);
        }

        // 2. Create permissions
        console.log('\nCreating permissions...');
        const permissionIds: Record<string, number> = {};

        for (const module of modules) {
            for (const action of module.actions) {
                const code = `${module.name}.${action}`;
                const result = await client.query(
                    `INSERT INTO permissions (module, action, code) 
                     VALUES ($1, $2, $3) 
                     ON CONFLICT (code) DO NOTHING
                     RETURNING id`,
                    [module.name, action, code]
                );
                
                if (result.rows.length > 0) {
                    permissionIds[code] = result.rows[0].id;
                    console.log(`✓ Created permission: ${code}`);
                } else {
                    // Get existing permission ID
                    const existing = await client.query(
                        'SELECT id FROM permissions WHERE code = $1',
                        [code]
                    );
                    if (existing.rows.length > 0) {
                        permissionIds[code] = existing.rows[0].id;
                    }
                }
            }
        }

        // 3. Assign all permissions to Owner and Admin
        console.log('\nAssigning permissions to Owner and Admin...');
        const allPermissionCodes = Object.keys(permissionIds);
        
        for (const roleName of ['owner', 'admin']) {
            const roleId = roleIds[roleName];
            
            for (const permissionCode of allPermissionCodes) {
                const permissionId = permissionIds[permissionCode];
                await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                    [roleId, permissionId]
                );
            }
            console.log(`✓ Assigned all permissions to ${roleName}`);
        }

        // 4. Assign limited permissions to Staff
        console.log('\nAssigning permissions to Staff...');
        const staffRoleId = roleIds['staff'];
        
        // Staff gets read-only for most modules
        const staffReadPermissions = [
            'users.read',
            'brands.read',
            'stores.read',
            'inventory.read',
            'suppliers.read',
            'item_groups.read',
            'customers.read',
            'pos.read',
            'invoices.read',
        ];

        // Staff can create POS invoices
        const staffCreatePermissions = [
            'pos.create',
            'invoices.create',
        ];

        const staffPermissions = [...staffReadPermissions, ...staffCreatePermissions];

        for (const permissionCode of staffPermissions) {
            const permissionId = permissionIds[permissionCode];
            if (permissionId) {
                await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                    [staffRoleId, permissionId]
                );
            }
        }
        console.log(`✓ Assigned limited permissions to staff`);

        // 5. Assign Manager permissions (read and write, but not delete for critical resources)
        console.log('\nAssigning permissions to Manager...');
        const managerRoleId = roleIds['manager'];
        
        const managerPermissions = [
            // Read all
            'users.read',
            'brands.read', 'brands.create', 'brands.update',
            'stores.read', 'stores.create', 'stores.update',
            'inventory.read', 'inventory.create', 'inventory.update',
            'suppliers.read', 'suppliers.create', 'suppliers.update',
            'item_groups.read', 'item_groups.create', 'item_groups.update',
            'customers.read', 'customers.create', 'customers.update',
            'pos.read', 'pos.create', 'pos.update',
            'invoices.read', 'invoices.create', 'invoices.update',
            'roles.read',
        ];

        for (const permissionCode of managerPermissions) {
            const permissionId = permissionIds[permissionCode];
            if (permissionId) {
                await client.query(
                    `INSERT INTO role_permissions (role_id, permission_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                    [managerRoleId, permissionId]
                );
            }
        }
        console.log(`✓ Assigned manager permissions`);

        await client.query('COMMIT');
        console.log('\n✅ Roles and permissions seeded successfully!');

        // 6. Migrate existing users to use role_id
        console.log('\nMigrating existing users to role_id...');
        await client.query(`
            UPDATE users u
            SET role_id = r.id
            FROM roles r
            WHERE LOWER(u.role) = LOWER(r.name)
            AND u.role_id IS NULL
        `);
        console.log('✓ User roles migrated');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding roles and permissions:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    seedRolesAndPermissions()
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}

export default seedRolesAndPermissions;

