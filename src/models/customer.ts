import pool from '../config/db';
import { Customer } from '../types';

export const createCustomer = async (customer: Partial<Customer>) => {
    const query = `
    INSERT INTO customers (
        name, email, phone, address, tax_id, credit_limit, current_balance,
        customer_code, status, created_by, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`;
    const values = [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.tax_id,
        customer.credit_limit || 0,
        customer.current_balance || 0,
        customer.customer_code,
        customer.status || 'active',
        customer.created_by,
        customer.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getCustomerById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0];
};

export const getPaginatedCustomers = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    sort: string = 'name ASC'
) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM customers WHERE deleted_at IS NULL';
    const values = [];
    let paramIndex = 1;

    if (status) {
        query += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
    }

    if (search) {
        query += ` AND (name ILIKE $${paramIndex} OR customer_code ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_]/g, '');
    const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);

    // Build count query
    let countQuery = 'SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL';
    const countValues = [];
    let countParamIndex = 1;

    if (status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countValues.push(status);
        countParamIndex++;
    }

    if (search) {
        countQuery += ` AND (name ILIKE $${countParamIndex} OR customer_code ILIKE $${countParamIndex} OR phone ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
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

export const getCustomersDropdown = async () => {
    const { rows } = await pool.query(
        'SELECT id, name, customer_code FROM customers WHERE deleted_at IS NULL AND status = \'active\' ORDER BY name ASC'
    );
    return rows;
};

export const updateCustomer = async (id: number, customer: Partial<Customer>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(customer)) {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
    UPDATE customers 
    SET ${fields.join(', ')}, updated_by = $${paramIndex}
    WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteCustomer = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE customers 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};