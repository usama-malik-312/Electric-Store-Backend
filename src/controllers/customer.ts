import { Response } from 'express';
import * as CustomerModel from '../models/customer';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, validateMandatoryFilters, getSortParams } from '../utils/pagination';

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customerData = {
            ...req.body,
            created_by: req.user?.id
        };
        const customer = await CustomerModel.createCustomer(customerData);
        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to create customer' 
        });
    }
};

export const getCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customer = await CustomerModel.getCustomerById(parseInt(req.params.id));
        if (!customer) {
            res.status(404).json({ 
                success: false,
                error: 'Customer not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch customer' 
        });
    }
};

export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate mandatory filters
        const validation = validateMandatoryFilters(req, ['status']);
        if (!validation.isValid) {
            res.status(400).json({
                success: false,
                error: `Missing required filters: ${validation.missing.join(', ')}`
            });
            return;
        }

        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'name ASC');
        const status = req.query.status as string;
        
        const result = await CustomerModel.getPaginatedCustomers(
            page,
            limit,
            search,
            status,
            sort
        );
        
        res.json({
            success: true,
            ...buildPaginationResponse(result.data, result.total, page, limit)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch customers' 
        });
    }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const updateData = {
            ...req.body,
            updated_by: req.user?.id
        };
        const customer = await CustomerModel.updateCustomer(
            parseInt(req.params.id),
            updateData
        );
        if (!customer) {
            res.status(404).json({ 
                success: false,
                error: 'Customer not found' 
            });
            return;
        }
        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to update customer' 
        });
    }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await CustomerModel.deleteCustomer(parseInt(req.params.id), req.user?.id);
        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete customer' 
        });
    }
};

export const getCustomersDropdown = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customers = await CustomerModel.getCustomersDropdown();
        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch customers dropdown' 
        });
    }
};