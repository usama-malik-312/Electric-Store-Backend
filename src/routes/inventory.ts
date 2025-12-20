import express from 'express';
import * as InventoryController from '../controllers/inventory';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('inventory.read'), InventoryController.getItemsDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('inventory.create'), InventoryController.createItem);
router.get('/', checkPermission('inventory.read'), InventoryController.getAllItems);
router.get('/low-stock', checkPermission('inventory.read'), InventoryController.getLowStockItems);
router.get('/:id', checkPermission('inventory.read'), InventoryController.getItem);
router.put('/:id', checkPermission('inventory.update'), InventoryController.updateItem);
router.delete('/:id', checkPermission('inventory.delete'), InventoryController.deleteItem);

export default router;
