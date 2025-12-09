import express from 'express';
import * as InventoryController from '../controllers/inventory';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', InventoryController.getItemsDropdown);

// CRUD routes - owner has full access
router.post('/', roleMiddleware('owner', 'admin', 'manager'), InventoryController.createItem);
router.get('/', InventoryController.getAllItems);
router.get('/low-stock', InventoryController.getLowStockItems);
router.get('/:id', InventoryController.getItem);
router.put('/:id', roleMiddleware('owner', 'admin', 'manager'), InventoryController.updateItem);
router.delete('/:id', roleMiddleware('owner', 'admin'), InventoryController.deleteItem);

export default router;
