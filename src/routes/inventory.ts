// ✅ Correct usage in routes/inventory.ts
import express from 'express';
import * as InventoryController from '../controllers/inventory';

const router = express.Router();

router.post('/inventory', InventoryController.createItem);
router.get('/inventory/:id', InventoryController.getItem);
router.get('/inventory', InventoryController.getAllItems);
router.put('/inventory/:id', InventoryController.updateItem); // ✅

router.delete('/inventory/:id', InventoryController.deleteItem);

export default router;
