import pool from "../config/db";
import { Inventory } from "../types";

export const createItem = async (item: Partial<Inventory>) => {
    const query = `
    INSERT INTO inventory (
        item_name, item_code, brand_id, supplier_id, item_group_id, 
        description, unit, cost_price, selling_price, tax_percentage, 
        discount, min_stock_level, stock, store_id, image, 
        status, created_by, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`;

    const values = [
        item.item_name,
        item.item_code,
        item.brand_id,
        item.supplier_id,
        item.item_group_id,
        item.description,
        item.unit,
        item.cost_price,
        item.selling_price,
        item.tax_percentage || 0,
        item.discount || 0,
        item.min_stock_level || 5,
        item.stock || 0,
        item.store_id,
        item.image,
        item.status || 'active',
        item.created_by,
        item.notes
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getItemById = async (id: number) => {
    const query = `
    SELECT 
      i.*,
      s.name as store_name,
      s.location as store_location,
      b.name as brand_name,
      sup.name as supplier_name,
      ig.group_name
    FROM inventory i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN brands b ON i.brand_id = b.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
    LEFT JOIN item_groups ig ON i.item_group_id = ig.id
    WHERE i.id = $1 AND i.deleted_at IS NULL`;

    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

export const getAllItems = async (
    filters: Partial<Inventory> = {},
    searchTerm?: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'item_name ASC'
) => {
    // Base query with joins
    let baseQuery = `
    SELECT 
      i.*,
      s.name as store_name,
      s.location as store_location,
      b.name as brand_name,
      sup.name as supplier_name,
      ig.group_name
    FROM inventory i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN brands b ON i.brand_id = b.id
    LEFT JOIN suppliers sup ON i.supplier_id = sup.id
    LEFT JOIN item_groups ig ON i.item_group_id = ig.id
    WHERE i.deleted_at IS NULL`;

    // Count query for pagination
    let countQuery = `SELECT COUNT(*) FROM inventory i WHERE i.deleted_at IS NULL`;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add search term
    if (searchTerm) {
        whereClauses.push(`(i.item_name ILIKE $${paramIndex} OR i.item_code ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex})`);
        values.push(`%${searchTerm}%`);
        paramIndex++;
    }

    // Add filters
    if (filters.store_id) {
        whereClauses.push(`i.store_id = $${paramIndex}`);
        values.push(filters.store_id);
        paramIndex++;
    }

    if (filters.brand_id) {
        whereClauses.push(`i.brand_id = $${paramIndex}`);
        values.push(filters.brand_id);
        paramIndex++;
    }

    if (filters.supplier_id) {
        whereClauses.push(`i.supplier_id = $${paramIndex}`);
        values.push(filters.supplier_id);
        paramIndex++;
    }

    if (filters.item_group_id) {
        whereClauses.push(`i.item_group_id = $${paramIndex}`);
        values.push(filters.item_group_id);
        paramIndex++;
    }

    if (filters.status !== undefined) {
        whereClauses.push(`i.status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
    }

    // Add WHERE clauses to both queries
    if (whereClauses.length > 0) {
        const whereClause = ` AND ${whereClauses.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Add sorting and pagination to main query
    baseQuery += `
    ORDER BY i.${sort.replace(' ASC', '').replace(' DESC', '')} ${sort.includes('DESC') ? 'DESC' : 'ASC'}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    // Execute both queries in parallel
    const [itemsResult, countResult] = await Promise.all([
        pool.query<Inventory>(baseQuery, values),
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

export const updateItem = async (id: number, updates: Partial<Inventory>) => {
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
    SET ${fields.join(', ')}, updated_by = $${paramIndex}
    WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteItem = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE inventory 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};

export const checkLowStock = async (threshold?: number, storeId?: number) => {
    const minThreshold = threshold || 5;
    let query = `
    SELECT 
      i.*,
      s.name as store_name,
      b.name as brand_name
    FROM inventory i
    LEFT JOIN stores s ON i.store_id = s.id
    LEFT JOIN brands b ON i.brand_id = b.id
    WHERE i.stock <= i.min_stock_level 
    AND i.stock <= $1 
    AND i.deleted_at IS NULL`;
    
    const params: any[] = [minThreshold];
    
    if (storeId) {
        query += ` AND i.store_id = $2`;
        params.push(storeId);
    }
    
    query += ` ORDER BY i.stock ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
};

export const getItemsDropdown = async (storeId?: number) => {
    let query = `
    SELECT 
        id,
        item_code,
        item_name,
        selling_price,
        stock,
        unit
    FROM inventory
    WHERE deleted_at IS NULL AND status = 'active'`;
    
    const params: any[] = [];
    
    if (storeId) {
        query += ` AND store_id = $1`;
        params.push(storeId);
    }
    
    query += ` ORDER BY item_name ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
};