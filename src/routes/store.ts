import express from 'express';
import * as StoreController from '../controllers/store';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', StoreController.getStoresDropdown);

// CRUD routes - all authenticated users can access
router.post('/', StoreController.createStore);
router.get('/', StoreController.getStores);
router.get('/:id', StoreController.getStore);
router.put('/:id', StoreController.updateStore);
router.delete('/:id', StoreController.deleteStore);

export default router;