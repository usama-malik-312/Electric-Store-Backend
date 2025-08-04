import pool from '../config/db';
import { hashPassword } from '../utils/auth';
import { User } from '../types';

export const createUser = async (user: Partial<User>) => {
    const hashedPassword = await hashPassword(user.password!);
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

    const query = `
    INSERT INTO users (
        email, password, role, full_name, phone, store_id, is_verified,
        verification_token, password_reset_token, first_name, last_name,
        address, profile_image, status, created_by, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id, email, role, full_name, phone, store_id, is_verified,
              first_name, last_name, address, profile_image, status, created_at`;
    const values = [
        user.email,
        hashedPassword,
        user.role || 'user',
        fullName,
        user.phone,
        user.store_id,
        user.is_verified ?? false,
        user.verification_token,
        user.password_reset_token,
        user.first_name,
        user.last_name,
        user.address,
        user.profile_image,
        user.status || 'active',
        user.created_by,
        user.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const findUserById = async (id: number) => {
    const { rows } = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [id]
    );
    return rows[0];
};

export const findUserByEmailOrPhone = async (identifier: string) => {
    const { rows } = await pool.query(
        `SELECT * FROM users 
     WHERE (email = $1 OR phone = $1) AND deleted_at IS NULL`,
        [identifier]
    );
    return rows[0];
};

// Add paginated users list
export const getPaginatedUsers = async (
    page: number = 1,
    limit: number = 10,
    search?: string
) => {
    const offset = (page - 1) * limit;
    let query = `
    SELECT * FROM users WHERE deleted_at IS NULL`;

    const values = [];
    let paramIndex = 1;

    if (search) {
        query += ` AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR full_name ILIKE $1)`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    query += `
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    const countQuery = `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL${search ? ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR full_name ILIKE $1)' : ''}`;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    return {
        data: rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
};

export const updateUser = async (id: number, updates: Partial<User>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id') {
            if (key === 'password') {
                fields.push(`password = $${paramIndex}`);
                values.push(await hashPassword(value as string));
            } else {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
            }
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
        UPDATE users 
        SET ${fields.join(', ')}, updated_by = $${paramIndex}
        WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
        RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteUser = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE users 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};