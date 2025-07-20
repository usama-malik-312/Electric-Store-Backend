import pool from '../config/db';
import { Store, PaginatedResponse } from '../types';

export const createStore = async (store: Store) => {
  const query = `
    INSERT INTO stores (name, location, contact_phone, opening_hours, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
  const values = [
    store.name,
    store.location,
    store.contact_phone,
    store.opening_hours,
    store.is_active ?? true
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getStoreById = async (id: number) => {
  const { rows } = await pool.query('SELECT * FROM stores WHERE id = $1', [id]);
  return rows[0];
};

export const getPaginatedStores = async (
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<PaginatedResponse<Store>> => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM stores';
  const values = [];

  if (search) {
    query += ' WHERE name ILIKE $1 OR location ILIKE $1';
    values.push(`%${search}%`);
  }

  query += ` ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  const countQuery = `SELECT COUNT(*) FROM stores${search ? ' WHERE name ILIKE $1 OR location ILIKE $1' : ''}`;
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
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  values.push(id);
  const query = `
    UPDATE stores 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *`;

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const deleteStore = async (id: number) => {
  await pool.query('DELETE FROM stores WHERE id = $1', [id]);
};