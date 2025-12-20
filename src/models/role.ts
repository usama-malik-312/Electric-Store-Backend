import pool from '../config/db';

export interface Role {
    id?: number;
    name: string;
    description?: string;
    is_system?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Permission {
    id?: number;
    module: string;
    action: string;
    code: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RolePermission {
    id?: number;
    role_id: number;
    permission_id: number;
    created_at?: string;
}

export interface RoleWithPermissions extends Role {
    permissions?: Permission[];
}

// Role CRUD operations
export const getAllRoles = async () => {
    const { rows } = await pool.query(
        'SELECT * FROM roles ORDER BY name ASC'
    );
    return rows;
};

export const getRoleById = async (id: number) => {
    const { rows } = await pool.query(
        'SELECT * FROM roles WHERE id = $1',
        [id]
    );
    return rows[0];
};

export const getRoleByName = async (name: string) => {
    const { rows } = await pool.query(
        'SELECT * FROM roles WHERE name = $1',
        [name]
    );
    return rows[0];
};

export const createRole = async (role: Partial<Role>) => {
    const { rows } = await pool.query(
        `INSERT INTO roles (name, description, is_system) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [role.name, role.description || null, role.is_system || false]
    );
    return rows[0];
};

export const updateRole = async (id: number, updates: Partial<Role>) => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
    }

    if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(id);
    const { rows } = await pool.query(
        `UPDATE roles 
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex} AND is_system = false
         RETURNING *`,
        values
    );
    return rows[0] || null;
};

export const deleteRole = async (id: number) => {
    // Check if role is system role or has users assigned
    const roleCheck = await pool.query(
        'SELECT is_system FROM roles WHERE id = $1',
        [id]
    );

    if (!roleCheck.rows[0]) {
        throw new Error('Role not found');
    }

    if (roleCheck.rows[0].is_system) {
        throw new Error('Cannot delete system role');
    }

    const userCheck = await pool.query(
        'SELECT COUNT(*) FROM users WHERE role_id = $1',
        [id]
    );

    if (parseInt(userCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete role with assigned users');
    }

    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    return true;
};

// Permission operations
export const getAllPermissions = async () => {
    const { rows } = await pool.query(
        'SELECT * FROM permissions ORDER BY module, action'
    );
    return rows;
};

export const getPermissionByCode = async (code: string) => {
    const { rows } = await pool.query(
        'SELECT * FROM permissions WHERE code = $1',
        [code]
    );
    return rows[0];
};

export const getPermissionsByCodes = async (codes: string[]) => {
    if (codes.length === 0) return [];
    const { rows } = await pool.query(
        'SELECT * FROM permissions WHERE code = ANY($1)',
        [codes]
    );
    return rows;
};

// Role-Permission operations
export const getRolePermissions = async (roleId: number) => {
    const { rows } = await pool.query(
        `SELECT p.*, rp.id as role_permission_id
         FROM permissions p
         INNER JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.module, p.action`,
        [roleId]
    );
    return rows;
};

export const getAllPermissionsWithRoleAssignment = async (roleId: number) => {
    // Get all permissions and mark which ones are assigned to the role
    const { rows } = await pool.query(
        `SELECT 
            p.*,
            CASE WHEN rp.id IS NOT NULL THEN true ELSE false END as assigned
         FROM permissions p
         LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = $1
         ORDER BY p.module, p.action`,
        [roleId]
    );
    return rows;
};

export const setRolePermissions = async (roleId: number, permissionCodes: string[]) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get permission IDs for the codes
        const permissionResult = await client.query(
            'SELECT id, code FROM permissions WHERE code = ANY($1)',
            [permissionCodes]
        );

        const foundCodes = permissionResult.rows.map((r: any) => r.code);
        const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
        
        if (missingCodes.length > 0) {
            throw new Error(`Some permissions not found: ${missingCodes.join(', ')}`);
        }

        // Delete existing permissions for this role
        await client.query(
            'DELETE FROM role_permissions WHERE role_id = $1',
            [roleId]
        );

        // Insert new permissions
        if (permissionResult.rows.length > 0) {
            const permissionIds = permissionResult.rows.map((r: any) => r.id);
            
            // Build insert query with proper parameterization
            const values = permissionIds.map((_, index) => `($1, $${index + 2})`).join(', ');
            const insertValues = [roleId, ...permissionIds];
            
            await client.query(
                `INSERT INTO role_permissions (role_id, permission_id) 
                 VALUES ${values}`,
                insertValues
            );
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Get user permissions by role
export const getUserPermissionsByRoleId = async (roleId: number): Promise<string[]> => {
    const { rows } = await pool.query(
        `SELECT p.code
         FROM permissions p
         INNER JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1`,
        [roleId]
    );
    return rows.map((row: any) => row.code);
};

// Get user role and permissions
export const getUserRoleAndPermissions = async (userId: number) => {
    const { rows } = await pool.query(
        `SELECT 
            r.*,
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                    'code', p.code,
                    'module', p.module,
                    'action', p.action
                )) FILTER (WHERE p.id IS NOT NULL),
                '[]'::json
            ) as permissions
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE u.id = $1 AND u.deleted_at IS NULL
         GROUP BY r.id`,
        [userId]
    );
    
    if (rows.length === 0) {
        return null;
    }

    const role = rows[0];
    role.permissions = role.permissions || [];
    return role;
};

