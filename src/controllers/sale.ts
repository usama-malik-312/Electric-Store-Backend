import { Response } from 'express';
import * as SaleModel from '../models/sale';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createSale = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        console.log('Received sale data:', JSON.stringify(req.body, null, 2));
        
        // Check if user is authenticated
        if (!req.user?.id) {
            res.status(401).json({
                success: false,
                error: 'Authentication required. Please login first.'
            });
            return;
        }
        
        const saleData = {
            ...req.body,
            user_id: req.user.id,  // Use user_id to match database column
            created_by: req.user.id  // Also set created_by for compatibility
        };
        
        // Validate required fields
        if (!saleData.store_id) {
            res.status(400).json({
                success: false,
                error: 'store_id is required'
            });
            return;
        }
        
        if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
            res.status(400).json({
                success: false,
                error: 'At least one item is required'
            });
            return;
        }
        
        // Validate items and normalize field names
        for (const item of saleData.items) {
            // Support both 'item_id' and 'inventory_id' field names
            if (!item.item_id && !item.inventory_id) {
                res.status(400).json({
                    success: false,
                    error: 'Each item must have item_id (or inventory_id), quantity, and unit_price'
                });
                return;
            }
            
            // Normalize: use inventory_id as item_id if item_id is not provided
            if (!item.item_id && item.inventory_id) {
                item.item_id = item.inventory_id;
            }
            
            if (!item.quantity || !item.unit_price) {
                res.status(400).json({
                    success: false,
                    error: 'Each item must have quantity and unit_price'
                });
                return;
            }
            
            // Calculate total_price if not provided
            if (!item.total_price) {
                const subtotal = item.quantity * item.unit_price;
                const discountAmount = (item.discount || 0) * subtotal / 100;
                const taxAmount = ((item.tax || 0) * (subtotal - discountAmount)) / 100;
                item.total_price = subtotal - discountAmount + taxAmount;
            }
        }
        
        // Calculate totals if not provided
        if (!saleData.total_amount) {
            saleData.total_amount = saleData.items.reduce((sum: number, item: any) => sum + item.total_price, 0);
        }
        
        if (!saleData.final_amount) {
            const discountAmount = ((saleData.discount || 0) * saleData.total_amount) / 100;
            const taxAmount = ((saleData.tax || 0) * (saleData.total_amount - discountAmount)) / 100;
            saleData.final_amount = saleData.total_amount - discountAmount + taxAmount;
        }
        
        const newSale = await SaleModel.createSale(saleData);
        
        res.status(201).json({
            success: true,
            data: newSale
        });
    } catch (error: any) {
        console.error('Error creating sale:', error);
        console.error('Error details:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create sale',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

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
        
        const sale = await SaleModel.getSaleById(id);
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

export const getAllSales = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'created_at DESC');
        
        // Extract filters
        const filters: any = {
            store_id: req.query.store_id ? parseInt(req.query.store_id as string) : undefined,
            customer_id: req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined,
            payment_status: req.query.payment_status as string | undefined,
            status: req.query.status as string | undefined,
        };
        
        const result = await SaleModel.getAllSales(
            filters,
            search,
            page,
            limit,
            sort
        );
        
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

