import express from 'express';
import * as SupplierController from '../controllers/supplier';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', SupplierController.getSuppliersDropdown);

// CRUD routes - all authenticated users can access
router.post('/', SupplierController.createSupplier);
router.get('/', SupplierController.getSuppliers);
router.get('/:id', SupplierController.getSupplierById);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

export default router; 