import pool from '../config/db';
import { hashPassword } from '../utils/auth';

interface User {
    id?: number;
    email?: string;
    phone?: string;
    password: string;
    role: string;
    is_verified?: boolean;
}

export const createUser = async (user: User) => {
    const hashedPassword = await hashPassword(user.password);
    const query = `
    INSERT INTO users (email, phone, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, phone, role, created_at`;
    const values = [user.email, user.phone, hashedPassword, user.role];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const findUserById = async (id: number) => {
    const { rows } = await pool.query(
        'SELECT id, email, phone, role FROM users WHERE id = $1',
        [id]
    );
    return rows[0];
};

export const findUserByEmailOrPhone = async (identifier: string) => {
    const { rows } = await pool.query(
        `SELECT * FROM users 
     WHERE email = $1 OR phone = $1`,
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
    SELECT id, email, phone, role, created_at 
    FROM users`;

    const values = [];
    let paramIndex = 1;

    if (search) {
        query += ` WHERE email ILIKE $1 OR phone ILIKE $1`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    query += `
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    const countQuery = `SELECT COUNT(*) FROM users${search ? ' WHERE email ILIKE $1 OR phone ILIKE $1' : ''}`;
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
        if (value !== undefined && key !== 'id' && key !== 'password') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (updates.password) {
        fields.push(`password = $${paramIndex}`);
        values.push(await hashPassword(updates.password));
        paramIndex++;
    }

    values.push(id);
    const query = `
        UPDATE users
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING id, email, phone, role, created_at`;
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteUser = async (id: number) => {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
};