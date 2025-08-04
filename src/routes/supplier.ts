import express from 'express';
import * as SupplierController from '../controllers/supplier';
// import { protect, isOwner } from '../middleware/auth';

const router = express.Router();

// Protect all routes
// router.use(protect);

// Owner-only routes
router.post('/', SupplierController.createSupplier);
router.get('/', SupplierController.getSuppliers);
router.get('/:id', SupplierController.getSupplierById);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

export default router; 