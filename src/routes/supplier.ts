import express from 'express';
import * as SupplierController from '../controllers/supplier';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('suppliers.read'), SupplierController.getSuppliersDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('suppliers.create'), SupplierController.createSupplier);
router.get('/', checkPermission('suppliers.read'), SupplierController.getSuppliers);
router.get('/:id', checkPermission('suppliers.read'), SupplierController.getSupplierById);
router.put('/:id', checkPermission('suppliers.update'), SupplierController.updateSupplier);
router.delete('/:id', checkPermission('suppliers.delete'), SupplierController.deleteSupplier);

export default router; 