import { Request, Response } from 'express';
import * as SupplierModel from '../models/supplier';

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const supplier = await SupplierModel.createSupplier(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
};

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const paginatedResponse = await SupplierModel.getPaginatedSuppliers(
            parseInt(page as string),
            parseInt(limit as string),
            search as string | undefined
        );
        res.json(paginatedResponse);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};

export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid supplier ID' });
            return;
        }
        const supplier = await SupplierModel.getSupplierById(id);
        if (!supplier) {
            res.status(404).json({ error: 'Supplier not found' });
            return;
        }
        res.json(supplier);
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid supplier ID' });
            return;
        }
        const updatedSupplier = await SupplierModel.updateSupplier(id, req.body);
        if (!updatedSupplier) {
            res.status(404).json({ error: 'Supplier not found' });
            return;
        }
        res.json(updatedSupplier);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
};



export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        await SupplierModel.deleteSupplier(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete store' });
    }
};