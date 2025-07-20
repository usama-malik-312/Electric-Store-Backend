import { Request, Response } from 'express';
import * as BrandModel from '../models/brand';
import { Brand } from '../types';

export const createBrand = async (req: Request, res: Response) => {
    try {
        const brand = await BrandModel.createBrand(req.body);
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create brand' });
    }
};

export const getBrand = async (req: Request, res: Response) => {
    try {
        const brand = await BrandModel.getBrandById(parseInt(req.params.id));
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch brand' });
    }
};

export const getBrands = async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const result = await BrandModel.getPaginatedBrands(
            parseInt(page as string),
            parseInt(limit as string),
            search as string | undefined
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
};

export const updateBrand = async (req: Request, res: Response) => {
    try {
        const brand = await BrandModel.updateBrand(
            parseInt(req.params.id),
            req.body
        );
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update brand' });
    }
};

export const deleteBrand = async (req: Request, res: Response) => {
    try {
        await BrandModel.deleteBrand(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete brand' });
    }
};