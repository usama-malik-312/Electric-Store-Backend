import pool from '../config/db';
import { Supplier } from '../types';

export const createSupplier = async (supplier: Partial<Supplier>) => {
    const query = `
        INSERT INTO suppliers (
            name, contact_person, email, phone, address, location,
            supplier_code, tax_id, status, created_by, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`;
    const values = [
        supplier.name,
        supplier.contact_person,
        supplier.email,
        supplier.phone,
        supplier.address,
        supplier.location,
        supplier.supplier_code,
        supplier.tax_id,
        supplier.status || 'active',
        supplier.created_by,
        supplier.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getSupplierById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM suppliers WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0];
};

export const getPaginatedSuppliers = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    sort: string = 'name ASC'
) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM suppliers WHERE deleted_at IS NULL';
    const values = [];

    if (search) {
        query += ' AND (name ILIKE $1 OR supplier_code ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)';
        values.push(`%${search}%`);
    }

    const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_]/g, '');
    const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    
    let countQuery = 'SELECT COUNT(*) FROM suppliers WHERE deleted_at IS NULL';
    const countValues = [];
    
    if (search) {
        countQuery += ' AND (name ILIKE $1 OR supplier_code ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)';
        countValues.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countValues);

    return {
        data: rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
};

export const updateSupplier = async (id: number, supplier: Partial<Supplier>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(supplier)) {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
        UPDATE suppliers 
        SET ${fields.join(', ')}, updated_by = $${paramIndex}
        WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
        RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteSupplier = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE suppliers 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};

export const getSuppliersDropdown = async () => {
    const { rows } = await pool.query(
        'SELECT id, name, supplier_code FROM suppliers WHERE deleted_at IS NULL AND status = \'active\' ORDER BY name ASC'
    );
    return rows;
}; 