import pool from '../config/db';
import { Brand } from '../types';

export const createBrand = async (brand: Partial<Brand>) => {
    const query = `
    INSERT INTO brands (
        name, brand_code, description, website, logo_url, created_by, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;
    const values = [
        brand.name,
        brand.brand_code,
        brand.description,
        brand.website,
        brand.logo_url,
        brand.created_by,
        brand.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getBrandById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM brands WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0];
};

export const getPaginatedBrands = async (
    page: number = 1,
    limit: number = 10,
    search?: string
) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM brands WHERE deleted_at IS NULL';
    const values = [];

    if (search) {
        query += ' AND (name ILIKE $1 OR brand_code ILIKE $1)';
        values.push(`%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    const countQuery = `SELECT COUNT(*) FROM brands WHERE deleted_at IS NULL${search ? ' AND (name ILIKE $1 OR brand_code ILIKE $1)' : ''}`;
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
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
    UPDATE brands 
    SET ${fields.join(', ')}, updated_by = $${paramIndex}
    WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteBrand = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE brands 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};