import { Response } from 'express';
import * as InventoryModel from '../models/inventory';
import { AuthenticatedRequest } from '../middleware/auth';

export const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const newItem = await InventoryModel.createItem(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
};

export const getItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID parameter' });
            return;
        }

        const item = await InventoryModel.getItemById(id);
        if (!item) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
};

export const getAllItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { search, page = '1', limit = '10', ...filters } = req.query;

        const paginatedResponse = await InventoryModel.getAllItems(
            filters,
            search as string | undefined,
            parseInt(page as string),
            parseInt(limit as string)
        );

        res.json(paginatedResponse);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({
            error: 'Failed to fetch inventory items'
        });
    }
};

export const updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID parameter' });
            return;
        }

        const updatedItem = await InventoryModel.updateItem(id, req.body);

        if (!updatedItem) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID parameter' });
            return;
        }
        await InventoryModel.deleteItem(id, req.user?.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
};

export const getLowStockItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
        const items = await InventoryModel.checkLowStock(threshold);
        res.json(items);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
};