import pool from '../config/db';
import { Store } from '../types';

export const createStore = async (store: Partial<Store>) => {
  const query = `
    INSERT INTO stores (
        name, store_code, location, description, contact_phone, 
        contact_number, status, is_active, opening_hours, created_by, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`;
  const values = [
    store.name,
    store.store_code,
    store.location,
    store.description,
    store.contact_phone,
    store.contact_number,
    store.status || 'active',
    store.is_active ?? true,
    store.opening_hours,
    store.created_by,
    store.notes
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getStoreById = async (id: number) => {
  const { rows } = await pool.query('SELECT * FROM stores WHERE id = $1 AND deleted_at IS NULL', [id]);
  return rows[0];
};

export const getPaginatedStores = async (
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM stores WHERE deleted_at IS NULL';
  const values = [];

  if (search) {
    query += ' AND (name ILIKE $1 OR store_code ILIKE $1 OR location ILIKE $1)';
    values.push(`%${search}%`);
  }

  query += ` ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  const countQuery = `SELECT COUNT(*) FROM stores WHERE deleted_at IS NULL${search ? ' AND (name ILIKE $1 OR store_code ILIKE $1 OR location ILIKE $1)' : ''}`;
  const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

  return {
    data: rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
  };
};

export const updateStore = async (id: number, store: Partial<Store>) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(store)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  values.push(id);
  const query = `
    UPDATE stores 
    SET ${fields.join(', ')}, updated_by = $${paramIndex}
    WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING *`;

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const deleteStore = async (id: number, deletedBy?: number) => {
  const query = `
    UPDATE stores 
    SET deleted_at = NOW(), updated_by = $2
    WHERE id = $1 AND deleted_at IS NULL`;
  await pool.query(query, [id, deletedBy]);
};