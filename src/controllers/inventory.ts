import { Request, Response } from 'express';
import * as InventoryModel from '../models/inventory';
import { InventoryItem } from '../types/inventory';

export const createItem = async (req: Request, res: Response) => {
    try {
        const newItem = await InventoryModel.createItem(req.body);
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
};

// import { Request, Response } from 'express';

export const getItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            //   return res.status(400).json({ error: 'Invalid ID parameter' });
            res.status(400).json({ error: 'Invalid ID parameter' });
            return; // ✅ Now the function still returns `void`
        }

        const item = await InventoryModel.getItemById(id);
        if (!item) {
            //   return res.status(404).json({ error: 'Item not found' });
            res.status(404).json({ error: 'Item not found' });
            return; // ✅ Now the function still returns `void`

        }

        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
};



// In your controller
export const getAllItems = async (req: Request, res: Response) => {
    try {
        const { search, page = '1', limit = '10', ...filters } = req.query;

        const paginatedResponse = await InventoryModel.getAllItems(
            filters as Partial<InventoryItem>,
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

export const updateItem = async (req: Request, res: Response): Promise<void> => {
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

export const deleteItem = async (req: Request, res: Response) => {
    try {
        await InventoryModel.deleteItem(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
};

export const getLowStockItems = async (req: Request, res: Response) => {
    try {
        const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
        const items = await InventoryModel.checkLowStock(threshold);
        res.json(items);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
};