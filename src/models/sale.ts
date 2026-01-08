import pool from "../config/db";
import { Sale, SaleItem } from "../types";

// Generate unique invoice number
const generateInvoiceNumber = async (): Promise<string> => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `INV-${year}${month}${day}-`;
    
    // Get the last invoice number for today
    const query = `
        SELECT invoice_number 
        FROM sales 
        WHERE invoice_number LIKE $1 
        ORDER BY invoice_number DESC 
        LIMIT 1
    `;
    
    const { rows } = await pool.query(query, [`${prefix}%`]);
    
    if (rows.length === 0) {
        return `${prefix}001`;
    }
    
    const lastNumber = parseInt(rows[0].invoice_number.split('-').pop() || '0');
    const nextNumber = String(lastNumber + 1).padStart(3, '0');
    
    return `${prefix}${nextNumber}`;
};

export const createSale = async (saleData: Sale): Promise<Sale> => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();
        
        // Insert sale - use user_id if it exists, otherwise use created_by
        // Check which column exists in the table
        const columnCheckQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sales' 
            AND column_name IN ('user_id', 'created_by')
            ORDER BY CASE column_name WHEN 'user_id' THEN 1 ELSE 2 END
            LIMIT 1
        `;
        const columnResult = await client.query(columnCheckQuery);
        const userIdColumn = columnResult.rows.length > 0 ? columnResult.rows[0].column_name : 'created_by';
        
        // Ensure user_id is provided - use created_by or user_id from saleData
        const userId = (saleData as any).user_id || saleData.created_by;
        if (!userId) {
            throw new Error('User ID is required. Please ensure you are authenticated.');
        }
        
        const saleQuery = `
            INSERT INTO sales (
                invoice_number, customer_id, store_id, total_amount, 
                discount, tax, final_amount, payment_method, payment_status, 
                status, notes, ${userIdColumn}
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        
        const saleValues = [
            invoiceNumber,
            saleData.customer_id || null,
            saleData.store_id,
            saleData.total_amount,
            saleData.discount || 0,
            saleData.tax || 0,
            saleData.final_amount,
            saleData.payment_method || 'cash',
            saleData.payment_status || 'paid',
            saleData.status || 'completed',
            saleData.notes || null,
            userId
        ];
        
        const saleResult = await client.query(saleQuery, saleValues);
        const sale = saleResult.rows[0];
        const saleId = sale.id;
        
        // Insert sale items and update inventory stock
        if (saleData.items && saleData.items.length > 0) {
            // Get ALL columns from sale_items table to know what we need to insert
            const allColumnsQuery = `
                SELECT column_name, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'sale_items'
                AND column_name NOT IN ('id', 'created_at')
                ORDER BY ordinal_position
            `;
            const allColumnsResult = await client.query(allColumnsQuery);
            const allColumns = allColumnsResult.rows;
            
            // Get required columns (NOT NULL and no default)
            const requiredColumns = allColumns
                .filter((col: any) => col.is_nullable === 'NO' && !col.column_default)
                .map((col: any) => col.column_name);
            
            // Get optional columns (nullable or have default)
            const optionalColumns = allColumns
                .filter((col: any) => col.is_nullable === 'YES' || col.column_default)
                .map((col: any) => col.column_name);
            
            for (const item of saleData.items) {
                // Fetch item details from inventory
                const itemDetailsQuery = `
                    SELECT item_name, item_code, price 
                    FROM inventory 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const itemDetailsResult = await client.query(itemDetailsQuery, [item.item_id]);
                
                if (itemDetailsResult.rows.length === 0) {
                    throw new Error(`Item with id ${item.item_id} not found`);
                }
                
                const itemDetails = itemDetailsResult.rows[0];
                
                // Calculate all possible values
                const subtotal = item.quantity * item.unit_price;
                const discountAmount = ((item.discount || 0) / 100) * subtotal;
                const taxAmount = ((item.tax || 0) / 100) * (subtotal - discountAmount);
                const total = subtotal - discountAmount + taxAmount;
                
                // Build columns and values dynamically
                const columns: string[] = [];
                const values: any[] = [];
                
                // Always include these core columns
                const coreColumns = ['sale_id', 'item_id', 'quantity', 'unit_price'];
                const coreValues = [saleId, item.item_id, item.quantity, item.unit_price];
                
                for (let i = 0; i < coreColumns.length; i++) {
                    if (requiredColumns.includes(coreColumns[i]) || optionalColumns.includes(coreColumns[i])) {
                        columns.push(coreColumns[i]);
                        values.push(coreValues[i]);
                    }
                }
                
                // Add optional/required columns with calculated values
                const calculatedFields: Record<string, any> = {
                    'item_name': itemDetails.item_name,
                    'item_code': itemDetails.item_code,
                    'subtotal': subtotal,
                    'total': total,
                    'total_price': item.total_price || total,
                    'discount': item.discount || 0,
                    'tax': item.tax || 0
                };
                
                // Add all required columns that we haven't added yet
                for (const col of requiredColumns) {
                    if (!columns.includes(col) && calculatedFields.hasOwnProperty(col)) {
                        columns.push(col);
                        values.push(calculatedFields[col]);
                    } else if (!columns.includes(col) && col !== 'sale_id' && col !== 'item_id' && col !== 'quantity' && col !== 'unit_price') {
                        // For other required columns, use default or calculated value
                        if (calculatedFields.hasOwnProperty(col)) {
                            columns.push(col);
                            values.push(calculatedFields[col]);
                        } else {
                            // Use 0 or empty string as default
                            columns.push(col);
                            values.push(col.includes('price') || col.includes('amount') || col.includes('total') || col.includes('subtotal') ? total : (col.includes('name') || col.includes('code') ? '' : 0));
                        }
                    }
                }
                
                // Add optional columns that we want to include
                for (const col of optionalColumns) {
                    if (!columns.includes(col) && calculatedFields.hasOwnProperty(col)) {
                        columns.push(col);
                        values.push(calculatedFields[col]);
                    }
                }
                
                const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
                const itemQuery = `
                    INSERT INTO sale_items (${columns.join(', ')})
                    VALUES (${placeholders})
                    RETURNING *
                `;
                
                // Check current stock BEFORE inserting sale item
                const checkStockQuery = `
                    SELECT stock, item_name 
                    FROM inventory 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const stockCheckResult = await client.query(checkStockQuery, [item.item_id]);
                
                if (stockCheckResult.rows.length === 0) {
                    throw new Error(`Item with id ${item.item_id} not found in inventory`);
                }
                
                const currentStock = stockCheckResult.rows[0].stock || 0;
                const itemName = stockCheckResult.rows[0].item_name || `Item #${item.item_id}`;
                
                // Validate stock availability
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for "${itemName}". Available: ${currentStock}, Requested: ${item.quantity}`);
                }
                
                // Insert sale item
                await client.query(itemQuery, values);
                
                // Update inventory stock - reduce by quantity sold
                const updateStockQuery = `
                    UPDATE inventory 
                    SET stock = stock - $1, updated_at = NOW()
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING stock, item_name
                `;
                
                const stockResult = await client.query(updateStockQuery, [item.quantity, item.item_id]);
                
                if (stockResult.rows.length === 0) {
                    throw new Error(`Failed to update stock for item ${item.item_id}`);
                }
                
                const newStock = stockResult.rows[0].stock;
                
                // Double-check stock didn't go negative (safety check)
                if (newStock < 0) {
                    throw new Error(`Stock update resulted in negative stock for "${itemName}". This should not happen.`);
                }
                
                console.log(`Inventory updated: ${itemName} - Stock reduced from ${currentStock} to ${newStock} (sold ${item.quantity})`);
            }
        }
        
        await client.query('COMMIT');
        
        // Fetch complete sale with items and related data
        const createdSale = await getSaleById(saleId);
        if (!createdSale) {
            throw new Error('Failed to retrieve created sale');
        }
        return createdSale;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getSaleById = async (id: number): Promise<Sale | null> => {
    const query = `
        SELECT 
            s.*,
            c.name as customer_name,
            st.name as store_name,
            st.location as store_location
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.id = $1 AND s.deleted_at IS NULL
    `;
    
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    const sale = rows[0];
    
    // Fetch sale items
    const itemsQuery = `
        SELECT 
            si.*,
            i.item_name,
            i.item_code,
            i.unit
        FROM sale_items si
        LEFT JOIN inventory i ON si.item_id = i.id
        WHERE si.sale_id = $1
        ORDER BY si.id
    `;
    
    const itemsResult = await pool.query(itemsQuery, [id]);
    sale.items = itemsResult.rows;
    
    return sale;
};

export const getAllSales = async (
    filters: Partial<Sale> = {},
    searchTerm?: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'created_at DESC'
) => {
    let baseQuery = `
        SELECT 
            s.*,
            c.name as customer_name,
            st.name as store_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.deleted_at IS NULL
    `;
    
    let countQuery = `SELECT COUNT(*) FROM sales s WHERE s.deleted_at IS NULL`;
    
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add search term
    if (searchTerm) {
        whereClauses.push(`(s.invoice_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
        values.push(`%${searchTerm}%`);
        paramIndex++;
    }
    
    // Add filters
    if (filters.store_id) {
        whereClauses.push(`s.store_id = $${paramIndex}`);
        values.push(filters.store_id);
        paramIndex++;
    }
    
    if (filters.customer_id) {
        whereClauses.push(`s.customer_id = $${paramIndex}`);
        values.push(filters.customer_id);
        paramIndex++;
    }
    
    if (filters.payment_status) {
        whereClauses.push(`s.payment_status = $${paramIndex}`);
        values.push(filters.payment_status);
        paramIndex++;
    }
    
    if (filters.status) {
        whereClauses.push(`s.status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
    }
    
    // Add WHERE clauses to both queries
    if (whereClauses.length > 0) {
        const whereClause = ` AND ${whereClauses.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }
    
    // Add sorting and pagination
    const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_]/g, '');
    const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY s.${sortField} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);
    
    // Execute both queries
    const [salesResult, countResult] = await Promise.all([
        pool.query<Sale>(baseQuery, values),
        pool.query<{ count: string }>(countQuery, values.slice(0, -2))
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    
    return {
        data: salesResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

