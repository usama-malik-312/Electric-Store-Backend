import { Response } from 'express';
import * as SupplierModel from '../models/supplier';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const supplierData = {
            ...req.body,
            created_by: req.user?.id
        };
        const supplier = await SupplierModel.createSupplier(supplierData);
        res.status(201).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create supplier' 
        });
    }
};

export const getSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'name ASC');
        
        const result = await SupplierModel.getPaginatedSuppliers(
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
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch suppliers' 
        });
    }
};

export const getSupplierById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid supplier ID' 
            });
            return;
        }
        const supplier = await SupplierModel.getSupplierById(id);
        if (!supplier) {
            res.status(404).json({ 
                success: false,
                error: 'Supplier not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch supplier' 
        });
    }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid supplier ID' 
            });
            return;
        }
        
        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };
        
        const updatedSupplier = await SupplierModel.updateSupplier(id, updateData);
        if (!updatedSupplier) {
            res.status(404).json({ 
                success: false,
                error: 'Supplier not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: updatedSupplier
        });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update supplier' 
        });
    }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ 
                success: false,
                error: 'Invalid supplier ID' 
            });
            return;
        }
        await SupplierModel.deleteSupplier(id, req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete supplier' 
        });
    }
};

export const getSuppliersDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const suppliers = await SupplierModel.getSuppliersDropdown();
        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch suppliers dropdown' 
        });
    }
};