import { Response } from 'express';
import * as CustomerModel from '../models/customer';
import { Customer } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customer = await CustomerModel.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

export const getCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customer = await CustomerModel.getCustomerById(parseInt(req.params.id));
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const result = await CustomerModel.getPaginatedCustomers(
            parseInt(page as string),
            parseInt(limit as string),
            search as string | undefined
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const customer = await CustomerModel.updateCustomer(
            parseInt(req.params.id),
            req.body
        );
        if (!customer) {
            res.status(404).json({ error: 'Customer not found' });
            return;
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        await CustomerModel.deleteCustomer(parseInt(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};