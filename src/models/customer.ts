import pool from '../config/db';
import { Customer, PaginatedResponse } from '../types';

export const createCustomer = async (customer: Customer) => {
    const query = `
    INSERT INTO customers (name, email, phone, address, tax_id, credit_limit)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
    const values = [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.tax_id,
        customer.credit_limit || 0
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getCustomerById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return rows[0];
};

export const getPaginatedCustomers = async (
    page: number = 1,
    limit: number = 10,
    search?: string
): Promise<PaginatedResponse<Customer>> => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM customers';
    const values = [];

    if (search) {
        query += ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1';
        values.push(`%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    const countQuery = `SELECT COUNT(*) FROM customers${search ? ' WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1' : ''}`;
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    return {
        data: rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
};

export const updateCustomer = async (id: number, customer: Partial<Customer>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(customer)) {
        if (value !== undefined) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
    UPDATE customers 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteCustomer = async (id: number) => {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
};