import { Response } from 'express';
import * as ItemGroupModel from '../models/itemGroup';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const itemGroupData = {
            ...req.body,
            created_by: req.user?.id
        };
        const itemGroup = await ItemGroupModel.createItemGroup(itemGroupData);
        res.status(201).json({
            success: true,
            data: itemGroup
        });
    } catch (error) {
        console.error('Error creating item group:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create item group' 
        });
    }
};

export const getItemGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'group_name ASC');
        
        const result = await ItemGroupModel.getPaginatedItemGroups(
            page,
            limit,
            search,
            sort
        );
        
        res.json({
            success: true,
            ...buildPaginationResponse(result.data, result.total, page, limit)
        });
    } catch (error) {
        console.error('Error fetching item groups:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch item groups' 
        });
    }
};

export const getItemGroupById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid item group ID' 
            });
            return;
        }
        const itemGroup = await ItemGroupModel.getItemGroupById(id);
        if (!itemGroup) {
            res.status(404).json({ 
                success: false,
                error: 'Item group not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: itemGroup
        });
    } catch (error) {
        console.error('Error fetching item group:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch item group' 
        });
    }
};

export const updateItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid item group ID' 
            });
            return;
        }
        
        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };
        
        const updatedItemGroup = await ItemGroupModel.updateItemGroup(id, updateData);
        if (!updatedItemGroup) {
            res.status(404).json({ 
                success: false,
                error: 'Item group not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: updatedItemGroup
        });
    } catch (error) {
        console.error('Error updating item group:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update item group' 
        });
    }
};

export const deleteItemGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid item group ID' 
            });
            return;
        }
        await ItemGroupModel.deleteItemGroup(id, req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Item group deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting item group:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete item group' 
        });
    }
};

export const getItemGroupsDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const itemGroups = await ItemGroupModel.getItemGroupsDropdown();
        res.json({
            success: true,
            data: itemGroups
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch item groups dropdown' 
        });
    }
}; 