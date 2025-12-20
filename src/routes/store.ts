import express from 'express';
import * as StoreController from '../controllers/store';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('stores.read'), StoreController.getStoresDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('stores.create'), StoreController.createStore);
router.get('/', checkPermission('stores.read'), StoreController.getStores);
router.get('/:id', checkPermission('stores.read'), StoreController.getStore);
router.put('/:id', checkPermission('stores.update'), StoreController.updateStore);
router.delete('/:id', checkPermission('stores.delete'), StoreController.deleteStore);

export default router;