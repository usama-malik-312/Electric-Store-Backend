import pool from "../config/db";
import { PaginatedResponse } from "../types/inventory";

interface InventoryItem {
    id?: number;
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    category?: string;
    brand?: string;
    stock: number;
    price: number;
    cost_price?: number;
    min_stock_level?: number;
    store_id: number;
    supplier_id?: number;
}

export const createItem = async (item: InventoryItem) => {
    const query = `
    INSERT INTO inventory (
      name, description, sku, barcode, category, brand, 
      stock, price, cost_price, min_stock_level, store_id, supplier_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`;

    const values = [
        item.name,
        item.description,
        item.sku,
        item.barcode,
        item.category,
        item.brand,
        item.stock,
        item.price,
        item.cost_price,
        item.min_stock_level || 5, // Default value
        item.store_id,
        item.supplier_id || null   // Handle optional field
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getItemById = async (id: number) => {
    const query = `
    SELECT 
      i.*,
      s.name as store_name,
      sup.name as supplier_name
    FROM inventory i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
    WHERE i.id = $1`;

    const { rows } = await pool.query(query, [id]);
    return rows[0];  // Make sure this returns a row
};

// src/models/inventory.ts
export const getAllItems = async (
    filters: Partial<InventoryItem> = {},
    searchTerm?: string,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedResponse<InventoryItem>> => {

    // Base query with joins
    let baseQuery = `
    SELECT 
      i.*,
      s.name as store_name,
      s.location as store_location,
      sup.name as supplier_name
    FROM inventory i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
  `;

    // Count query for pagination
    let countQuery = `SELECT COUNT(*) FROM inventory i LEFT JOIN stores s ON i.store_id = s.id`;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter handling (same as before)
    // ...

    // Add WHERE clauses to both queries
    if (whereClauses.length > 0) {
        const whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Add pagination to main query
    baseQuery += `
    ORDER BY i.name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
    values.push(limit, (page - 1) * limit);
    paramIndex += 2;

    // Execute both queries in parallel
    const [itemsResult, countResult] = await Promise.all([
        pool.query<InventoryItem>(baseQuery, values),
        pool.query<{ count: string }>(countQuery, values.slice(0, -2)) // Exclude pagination params for count
    ]);

    const total = parseInt(countResult.rows[0].count);

    return {
        data: itemsResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};
export const updateItem = async (id: number, updates: Partial<InventoryItem>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);

    const query = `
    UPDATE inventory 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteItem = async (id: number) => {
    await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
};

export const checkLowStock = async (threshold?: number) => {
    const query = `
    SELECT * FROM inventory 
    WHERE stock <= ${threshold !== undefined ? '$1' : 'min_stock_level'}
    ORDER BY stock ASC`;

    const values = threshold !== undefined ? [threshold] : [];
    const { rows } = await pool.query(query, values);
    return rows;
};