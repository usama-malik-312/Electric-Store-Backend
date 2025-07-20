// ✅ Correct usage in routes/inventory.ts
import express from 'express';
import * as InventoryController from '../controllers/inventory';

const router = express.Router();

router.post('/', InventoryController.createItem);
router.get('/:id', InventoryController.getItem);
router.get('/', InventoryController.getAllItems);
router.put('/:id', InventoryController.updateItem);
router.delete('/:id', InventoryController.deleteItem);

export default router;
