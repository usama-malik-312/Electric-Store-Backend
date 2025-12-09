import { Response } from 'express';
import * as InventoryModel from '../models/inventory';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, validateMandatoryFilters, getSortParams } from '../utils/pagination';

export const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const itemData = {
            ...req.body,
            created_by: req.user?.id
        };
        const newItem = await InventoryModel.createItem(itemData);
        res.status(201).json({
            success: true,
            data: newItem
        });
    } catch (error: any) {
        console.error('Error creating item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create inventory item' 
        });
    }
};

export const getItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid ID parameter' 
            });
            return;
        }

        const item = await InventoryModel.getItemById(id);
        if (!item) {
            res.status(404).json({ 
                success: false,
                error: 'Item not found' 
            });
            return;
        }

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch inventory item' 
        });
    }
};

export const getAllItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate mandatory filters
        const validation = validateMandatoryFilters(req, ['store_id']);
        if (!validation.isValid) {
            res.status(400).json({
                success: false,
                error: `Missing required filters: ${validation.missing.join(', ')}`
            });
            return;
        }

        const { page, limit, offset } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'item_name ASC');
        
        // Extract filters
        const filters: any = {
            store_id: parseInt(req.query.store_id as string),
            status: req.query.status as string | undefined,
            brand_id: req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined,
            supplier_id: req.query.supplier_id ? parseInt(req.query.supplier_id as string) : undefined,
            item_group_id: req.query.item_group_id ? parseInt(req.query.item_group_id as string) : undefined,
        };

        const result = await InventoryModel.getAllItems(
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
        console.error('Error fetching items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory items'
        });
    }
};

export const updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid ID parameter' 
            });
            return;
        }

        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };

        const updatedItem = await InventoryModel.updateItem(id, updateData);

        if (!updatedItem) {
            res.status(404).json({ 
                success: false,
                error: 'Item not found' 
            });
            return;
        }

        res.json({
            success: true,
            data: updatedItem
        });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update inventory item' 
        });
    }
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid ID parameter' 
            });
            return;
        }
        await InventoryModel.deleteItem(id, req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete inventory item' 
        });
    }
};

export const getLowStockItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate mandatory filters
        const validation = validateMandatoryFilters(req, ['store_id']);
        if (!validation.isValid) {
            res.status(400).json({
                success: false,
                error: `Missing required filters: ${validation.missing.join(', ')}`
            });
            return;
        }

        const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
        const storeId = parseInt(req.query.store_id as string);
        const items = await InventoryModel.checkLowStock(threshold, storeId);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch low stock items' 
        });
    }
};

// Dropdown endpoint
export const getItemsDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const storeId = req.query.store_id ? parseInt(req.query.store_id as string) : undefined;
        const items = await InventoryModel.getItemsDropdown(storeId);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching items dropdown:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch items dropdown' 
        });
    }
};