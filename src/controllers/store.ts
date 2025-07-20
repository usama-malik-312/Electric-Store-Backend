import { Request, Response } from 'express';
import * as StoreModel from '../models/store';
import { Store } from '../types';

export const createStore = async (req: Request, res: Response) => {
    try {
        const store = await StoreModel.createStore(req.body);
        res.status(201).json(store);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create store' });
    }
};

export const getStore = async (req: Request, res: Response) => {
    try {
        const store = await StoreModel.getStoreById(parseInt(req.params.id));
        if (!store) return res.status(404).json({ error: 'Store not found' });
        res.json(store);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch store' });
    }
};

export const getStores = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const result = await StoreModel.getPaginatedStores(
            parseInt(page as string),
            parseInt(limit as string),
            search as string | undefined
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
};

export const updateStore = async (req: Request, res: Response) => {
    try {
        const store = await StoreModel.updateStore(parseInt(req.params.id), req.body);
        if (!store) return res.status(404).json({ error: 'Store not found' });
        res.json(store);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update store' });
    }
};

export const deleteStore = async (req: Request, res: Response) => {
    try {
        await StoreModel.deleteStore(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete store' });
    }
};