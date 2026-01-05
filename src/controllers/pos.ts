import { Response } from 'express';
import * as POSModel from '../models/pos';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';
import { CreateSaleRequest } from '../types';

/**
 * Create a new sale
 * POST /api/pos/sales
 */
export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate required fields
        if (!req.body.store_id || !req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: store_id, items (non-empty array)'
            });
            return;
        }

        if (req.body.amount_paid === undefined || req.body.amount_paid < 0) {
            res.status(400).json({
                success: false,
                error: 'amount_paid is required and must be >= 0'
            });
            return;
        }

        // Validate items
        for (const item of req.body.items) {
            if (!item.inventory_id || !item.quantity || item.quantity <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'Each item must have inventory_id and quantity > 0'
                });
                return;
            }
        }

        const saleData: CreateSaleRequest = {
            store_id: parseInt(req.body.store_id),
            customer_id: req.body.customer_id ? parseInt(req.body.customer_id) : undefined,
            items: req.body.items.map((item: any) => ({
                inventory_id: parseInt(item.inventory_id),
                quantity: parseInt(item.quantity),
                unit_price: item.unit_price ? parseFloat(item.unit_price) : undefined,
                tax_percentage: item.tax_percentage ? parseFloat(item.tax_percentage) : undefined,
                discount_percentage: item.discount_percentage ? parseFloat(item.discount_percentage) : undefined
            })),
            payment_method: req.body.payment_method || 'cash',
            payment_status: req.body.payment_status,
            amount_paid: parseFloat(req.body.amount_paid),
            discount_amount: req.body.discount_amount ? parseFloat(req.body.discount_amount) : undefined,
            notes: req.body.notes
        };

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        const newSale = await POSModel.createSale(saleData, userId);

        res.status(201).json({
            success: true,
            data: newSale
        });
    } catch (error: any) {
        console.error('Error creating sale:', error);
        
        // Handle specific errors
        if (error.message?.includes('Insufficient stock') || error.message?.includes('not found')) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create sale'
        });
    }
};

/**
 * Get sale by ID
 * GET /api/pos/sales/:id
 */
export const getSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID parameter'
            });
            return;
        }

        const sale = await POSModel.getSaleById(id);
        if (!sale) {
            res.status(404).json({
                success: false,
                error: 'Sale not found'
            });
            return;
        }

        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sale'
        });
    }
};

/**
 * Get paginated sales
 * GET /api/pos/sales
 */
export const getSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'sale_date DESC');

        // Extract filters
        const filters: any = {
            store_id: req.query.store_id ? parseInt(req.query.store_id as string) : undefined,
            customer_id: req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined,
            user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
            payment_status: req.query.payment_status as string | undefined,
            status: req.query.status as string | undefined,
            start_date: req.query.start_date as string | undefined,
            end_date: req.query.end_date as string | undefined
        };

        const result = await POSModel.getSales(filters, search, page, limit, sort);

        res.json({
            success: true,
            ...buildPaginationResponse(result.data, result.total, page, limit)
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales'
        });
    }
};

/**
 * Cancel a sale
 * POST /api/pos/sales/:id/cancel
 */
export const cancelSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid ID parameter'
            });
            return;
        }

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        const cancelledSale = await POSModel.cancelSale(id, userId);

        res.json({
            success: true,
            data: cancelledSale,
            message: 'Sale cancelled successfully'
        });
    } catch (error: any) {
        console.error('Error cancelling sale:', error);
        
        if (error.message?.includes('not found') || 
            error.message?.includes('already cancelled') || 
            error.message?.includes('refunded')) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to cancel sale'
        });
    }
};

/**
 * Get sales statistics
 * GET /api/pos/statistics
 */
export const getSalesStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : undefined;
        const startDate = req.query.start_date as string | undefined;
        const endDate = req.query.end_date as string | undefined;

        const statistics = await POSModel.getSalesStatistics(storeId, startDate, endDate);

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error fetching sales statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales statistics'
        });
    }
};

