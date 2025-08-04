import { Response } from 'express';
import * as ItemGroupModel from '../models/itemGroup';
import { AuthenticatedRequest } from '../middleware/auth';

export const createItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const itemGroup = await ItemGroupModel.createItemGroup(req.body);
        res.status(201).json(itemGroup);
    } catch (error) {
        console.error('Error creating item group:', error);
        res.status(500).json({ error: 'Failed to create item group' });
    }
};

export const getItemGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const paginatedResponse = await ItemGroupModel.getPaginatedItemGroups(
            parseInt(page as string),
            parseInt(limit as string),
            search as string | undefined
        );
        res.json(paginatedResponse);
    } catch (error) {
        console.error('Error fetching item groups:', error);
        res.status(500).json({ error: 'Failed to fetch item groups' });
    }
};

export const getItemGroupById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid item group ID' });
            return;
        }
        const itemGroup = await ItemGroupModel.getItemGroupById(id);
        if (!itemGroup) {
            res.status(404).json({ error: 'Item group not found' });
            return;
        }
        res.json(itemGroup);
    } catch (error) {
        console.error('Error fetching item group:', error);
        res.status(500).json({ error: 'Failed to fetch item group' });
    }
};

export const updateItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid item group ID' });
            return;
        }
        const updatedItemGroup = await ItemGroupModel.updateItemGroup(id, req.body);
        if (!updatedItemGroup) {
            res.status(404).json({ error: 'Item group not found' });
            return;
        }
        res.json(updatedItemGroup);
    } catch (error) {
        console.error('Error updating item group:', error);
        res.status(500).json({ error: 'Failed to update item group' });
    }
};

export const deleteItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid item group ID' });
            return;
        }
        await ItemGroupModel.deleteItemGroup(id, req.user?.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item group:', error);
        res.status(500).json({ error: 'Failed to delete item group' });
    }
}; 