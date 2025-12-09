import { Response } from 'express';
import * as BrandModel from '../models/brand';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const brandData = {
            ...req.body,
            created_by: req.user?.id
        };
        const brand = await BrandModel.createBrand(brandData);
        res.status(201).json({
            success: true,
            data: brand
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to create brand' 
        });
    }
};

export const getBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const brand = await BrandModel.getBrandById(parseInt(req.params.id));
        if (!brand) {
            res.status(404).json({ 
                success: false,
                error: 'Brand not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: brand
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch brand' 
        });
    }
};

export const getBrands = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'name ASC');
        
        const result = await BrandModel.getPaginatedBrands(
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
            error: 'Failed to fetch brands' 
        });
    }
};

export const updateBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };
        const brand = await BrandModel.updateBrand(
            parseInt(req.params.id),
            updateData
        );
        if (!brand) {
            res.status(404).json({ 
                success: false,
                error: 'Brand not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: brand
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to update brand' 
        });
    }
};

export const deleteBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await BrandModel.deleteBrand(parseInt(req.params.id), req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Brand deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete brand' 
        });
    }
};

export const getBrandsDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const brands = await BrandModel.getBrandsDropdown();
        res.json({
            success: true,
            data: brands
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch brands dropdown' 
        });
    }
};