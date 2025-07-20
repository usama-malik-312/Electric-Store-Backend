import pool from '../config/db';
import { Brand, PaginatedResponse } from '../types';

export const createBrand = async (brand: Brand) => {
    const query = `
    INSERT INTO brands (name, description, website, logo_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    const values = [
        brand.name,
        brand.description,
        brand.website,
        brand.logo_url
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getBrandById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM brands WHERE id = $1', [id]);
    return rows[0];
};

export const getPaginatedBrands = async (
    page: number = 1,
    limit: number = 10,
    search?: string
): Promise<PaginatedResponse<Brand>> => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM brands';
    const values = [];

    if (search) {
        query += ' WHERE name ILIKE $1 OR description ILIKE $1';
        values.push(`%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    const countQuery = `SELECT COUNT(*) FROM brands${search ? ' WHERE name ILIKE $1 OR description ILIKE $1' : ''}`;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    return {
        data: rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
};

export const updateBrand = async (id: number, brand: Partial<Brand>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(brand)) {
        if (value !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
    UPDATE brands 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteBrand = async (id: number) => {
    await pool.query('DELETE FROM brands WHERE id = $1', [id]);
};