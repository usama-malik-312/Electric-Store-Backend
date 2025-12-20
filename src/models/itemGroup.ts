import pool from '../config/db';
import { ItemGroup } from '../types';

export const createItemGroup = async (itemGroup: Partial<ItemGroup>) => {
    const query = `
        INSERT INTO item_groups (
            group_name, group_code, description, status, created_by, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
    const values = [
        itemGroup.group_name,
        itemGroup.group_code,
        itemGroup.description,
        itemGroup.status || 'active',
        itemGroup.created_by,
        itemGroup.notes
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const getItemGroupById = async (id: number) => {
    const { rows } = await pool.query('SELECT * FROM item_groups WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0];
};

export const getPaginatedItemGroups = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    sort: string = 'group_name ASC'
) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM item_groups WHERE deleted_at IS NULL';
    const values = [];

    if (search) {
        query += ' AND (group_name ILIKE $1 OR group_code ILIKE $1)';
        values.push(`%${search}%`);
    }

    const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_]/g, '');
    const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    
    let countQuery = 'SELECT COUNT(*) FROM item_groups WHERE deleted_at IS NULL';
    const countValues = [];
    
    if (search) {
        countQuery += ' AND (group_name ILIKE $1 OR group_code ILIKE $1)';
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

export const updateItemGroup = async (id: number, itemGroup: Partial<ItemGroup>) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(itemGroup)) {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    values.push(id);
    const query = `
        UPDATE item_groups 
        SET ${fields.join(', ')}, updated_by = $${paramIndex}
        WHERE id = $${paramIndex + 1} AND deleted_at IS NULL
        RETURNING *`;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

export const deleteItemGroup = async (id: number, deletedBy?: number) => {
    const query = `
        UPDATE item_groups 
        SET deleted_at = NOW(), updated_by = $2
        WHERE id = $1 AND deleted_at IS NULL`;
    await pool.query(query, [id, deletedBy]);
};

export const getItemGroupsDropdown = async () => {
    const { rows } = await pool.query(
        'SELECT id, group_name, group_code FROM item_groups WHERE deleted_at IS NULL AND status = \'active\' ORDER BY group_name ASC'
    );
    return rows;
}; 