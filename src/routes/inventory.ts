import express from 'express';
import * as InventoryController from '../controllers/inventory';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', InventoryController.getItemsDropdown);

// CRUD routes - all authenticated users can access
router.post('/', InventoryController.createItem);
router.get('/', InventoryController.getAllItems);
router.get('/low-stock', InventoryController.getLowStockItems);
router.get('/:id', InventoryController.getItem);
router.put('/:id', InventoryController.updateItem);
router.delete('/:id', InventoryController.deleteItem);

export default router;
