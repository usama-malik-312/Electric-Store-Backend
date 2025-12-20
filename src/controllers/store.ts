import { Response } from 'express';
import * as StoreModel from '../models/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const storeData = {
            ...req.body,
            created_by: req.user?.id
        };
        const store = await StoreModel.createStore(storeData);
        res.status(201).json({
            success: true,
            data: store
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to create store' 
        });
    }
};

export const getStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid store ID' 
            });
            return;
        }

        const store = await StoreModel.getStoreById(id);
        if (!store) {
            res.status(404).json({ 
                success: false,
                error: 'Store not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch store' 
        });
    }
};

export const getStores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'name ASC');
        
        const result = await StoreModel.getPaginatedStores(
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
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch stores' 
        });
    }
};

export const updateStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid store ID' 
            });
            return;
        }

        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };

        const store = await StoreModel.updateStore(id, updateData);
        if (!store) {
            res.status(404).json({ 
                success: false,
                error: 'Store not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to update store' 
        });
    }
};

export const deleteStore = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid store ID' 
            });
            return;
        }

        await StoreModel.deleteStore(id, req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Store deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete store' 
        });
    }
};

export const getStoresDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const stores = await StoreModel.getStoresDropdown();
        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch stores dropdown' 
        });
    }
};