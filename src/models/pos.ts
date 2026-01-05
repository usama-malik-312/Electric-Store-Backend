import pool from '../config/db';
import { Sale, SaleItem, CreateSaleRequest, PaginatedResponse } from '../types';

/**
 * Create a new sale with items
 * This function handles the entire transaction including stock updates
 */
export const createSale = async (saleData: CreateSaleRequest, userId: number): Promise<Sale> => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Calculate totals for each item
        const saleItems: SaleItem[] = [];
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        // Fetch inventory items and calculate totals
        for (const item of saleData.items) {
            // Get inventory item details
            const inventoryQuery = `
                SELECT id, item_name, item_code, price, stock, unit, tax_percentage 
                FROM inventory 
                WHERE id = $1 AND deleted_at IS NULL AND status = 'active'
            `;
            const inventoryResult = await client.query(inventoryQuery, [item.inventory_id]);
            
            if (inventoryResult.rows.length === 0) {
                throw new Error(`Inventory item with id ${item.inventory_id} not found`);
            }

            const inventory = inventoryResult.rows[0];

            // Check stock availability
            if (inventory.stock < item.quantity) {
                throw new Error(`Insufficient stock for item ${inventory.item_name}. Available: ${inventory.stock}, Requested: ${item.quantity}`);
            }

            // Use provided price or inventory price
            const unitPrice = item.unit_price || inventory.price;
            const taxPercentage = item.tax_percentage ?? inventory.tax_percentage ?? 0;
            const discountPercentage = item.discount_percentage ?? 0;

            // Calculate item totals
            const itemSubtotal = unitPrice * item.quantity;
            const itemDiscount = (itemSubtotal * discountPercentage) / 100;
            const itemSubtotalAfterDiscount = itemSubtotal - itemDiscount;
            const itemTax = (itemSubtotalAfterDiscount * taxPercentage) / 100;
            const itemTotal = itemSubtotalAfterDiscount + itemTax;

            subtotal += itemSubtotal;
            totalDiscount += itemDiscount;
            totalTax += itemTax;

            saleItems.push({
                inventory_id: item.inventory_id,
                item_name: inventory.item_name,
                item_code: inventory.item_code,
                unit: inventory.unit,
                unit_price: unitPrice,
                quantity: item.quantity,
                tax_percentage: taxPercentage,
                discount_percentage: discountPercentage,
                subtotal: itemSubtotal,
                discount_amount: itemDiscount,
                tax_amount: itemTax,
                total: itemTotal
            });
        }

        // Calculate final totals
        const finalSubtotal = subtotal - (saleData.discount_amount || 0);
        const totalAmount = finalSubtotal + totalTax;
        const amountDue = totalAmount - saleData.amount_paid;

        // Create sale record
        const saleQuery = `
            INSERT INTO sales (
                store_id, customer_id, user_id,
                subtotal, tax_amount, discount_amount, total_amount,
                payment_method, payment_status, amount_paid, amount_due,
                notes, created_by, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const saleValues = [
            saleData.store_id,
            saleData.customer_id || null,
            userId,
            subtotal,
            totalTax,
            saleData.discount_amount || 0,
            totalAmount,
            saleData.payment_method || 'cash',
            saleData.payment_status || (amountDue > 0 ? 'partial' : 'paid'),
            saleData.amount_paid,
            amountDue,
            saleData.notes || null,
            userId,
            'completed'
        ];

        const saleResult = await client.query(saleQuery, saleValues);
        const sale = saleResult.rows[0];

        // Create sale items
        const itemInsertQuery = `
            INSERT INTO sale_items (
                sale_id, inventory_id, item_name, item_code, unit,
                unit_price, quantity, tax_percentage, discount_percentage,
                subtotal, tax_amount, discount_amount, total
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        for (const item of saleItems) {
            await client.query(itemInsertQuery, [
                sale.id,
                item.inventory_id,
                item.item_name,
                item.item_code,
                item.unit,
                item.unit_price,
                item.quantity,
                item.tax_percentage,
                item.discount_percentage,
                item.subtotal,
                item.tax_amount,
                item.discount_amount,
                item.total
            ]);

            // Update inventory stock
            const updateStockQuery = `
                UPDATE inventory 
                SET stock = stock - $1, updated_at = NOW()
                WHERE id = $2 AND deleted_at IS NULL
            `;
            await client.query(updateStockQuery, [item.quantity, item.inventory_id]);
        }

        await client.query('COMMIT');

        // Fetch complete sale with items
        return await getSaleById(sale.id);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get sale by ID with related data
 */
export const getSaleById = async (id: number): Promise<Sale | null> => {
    const query = `
        SELECT 
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.email as customer_email,
            st.name as store_name,
            u.first_name || ' ' || u.last_name as user_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1 AND s.deleted_at IS NULL
    `;

    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
        return null;
    }

    const sale = rows[0];

    // Get sale items
    const itemsQuery = `
        SELECT 
            si.*,
            i.item_name as current_item_name,
            i.price as current_price,
            i.stock as current_stock
        FROM sale_items si
        LEFT JOIN inventory i ON si.inventory_id = i.id
        WHERE si.sale_id = $1
        ORDER BY si.id
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);
    sale.items = itemsResult.rows;

    return sale;
};

/**
 * Get paginated sales with filters
 */
export const getSales = async (
    filters: {
        store_id?: number;
        customer_id?: number;
        user_id?: number;
        payment_status?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    } = {},
    searchTerm?: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'sale_date DESC'
): Promise<PaginatedResponse<Sale>> => {
    let baseQuery = `
        SELECT 
            s.*,
            c.name as customer_name,
            c.phone as customer_phone,
            st.name as store_name,
            u.first_name || ' ' || u.last_name as user_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.deleted_at IS NULL
    `;

    let countQuery = `SELECT COUNT(*) FROM sales s WHERE s.deleted_at IS NULL`;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

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

    if (filters.user_id) {
        whereClauses.push(`s.user_id = $${paramIndex}`);
        values.push(filters.user_id);
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

    if (filters.start_date) {
        whereClauses.push(`s.sale_date >= $${paramIndex}`);
        values.push(filters.start_date);
        paramIndex++;
    }

    if (filters.end_date) {
        whereClauses.push(`s.sale_date <= $${paramIndex}`);
        values.push(filters.end_date);
        paramIndex++;
    }

    // Add search term
    if (searchTerm) {
        whereClauses.push(`(s.sale_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
        values.push(`%${searchTerm}%`);
        paramIndex++;
    }

    // Add WHERE clauses
    if (whereClauses.length > 0) {
        const whereClause = ` AND ${whereClauses.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Add sorting and pagination
    const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_.]/g, '');
    const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY s.${sortField} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    // Execute queries
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

/**
 * Cancel a sale (restore stock)
 */
export const cancelSale = async (id: number, userId: number): Promise<Sale | null> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get sale with items
        const sale = await getSaleById(id);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Sale is already cancelled');
        }

        if (sale.status === 'refunded') {
            throw new Error('Cannot cancel a refunded sale');
        }

        // Restore stock for each item
        for (const item of sale.items || []) {
            const updateStockQuery = `
                UPDATE inventory 
                SET stock = stock + $1, updated_at = NOW()
                WHERE id = $2 AND deleted_at IS NULL
            `;
            await client.query(updateStockQuery, [item.quantity, item.inventory_id]);
        }

        // Update sale status
        const updateSaleQuery = `
            UPDATE sales 
            SET status = 'cancelled', updated_by = $1, updated_at = NOW()
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *
        `;

        const { rows } = await client.query(updateSaleQuery, [userId, id]);
        await client.query('COMMIT');

        return await getSaleById(id);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get sales statistics/dashboard data
 */
export const getSalesStatistics = async (
    storeId?: number,
    startDate?: string,
    endDate?: string
): Promise<any> => {
    let query = `
        SELECT 
            COUNT(*) as total_sales,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(SUM(amount_paid), 0) as total_collected,
            COALESCE(SUM(amount_due), 0) as total_outstanding,
            COALESCE(AVG(total_amount), 0) as average_sale_amount
        FROM sales
        WHERE deleted_at IS NULL AND status = 'completed'
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (storeId) {
        query += ` AND store_id = $${paramIndex}`;
        values.push(storeId);
        paramIndex++;
    }

    if (startDate) {
        query += ` AND sale_date >= $${paramIndex}`;
        values.push(startDate);
        paramIndex++;
    }

    if (endDate) {
        query += ` AND sale_date <= $${paramIndex}`;
        values.push(endDate);
        paramIndex++;
    }

    const { rows } = await pool.query(query, values);
    return rows[0];
};

