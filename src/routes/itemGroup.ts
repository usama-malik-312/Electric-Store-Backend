import express from 'express';
import * as ItemGroupController from '../controllers/itemGroup';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('item_groups.read'), ItemGroupController.getItemGroupsDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('item_groups.create'), ItemGroupController.createItemGroup);
router.get('/', checkPermission('item_groups.read'), ItemGroupController.getItemGroups);
router.get('/:id', checkPermission('item_groups.read'), ItemGroupController.getItemGroupById);
router.put('/:id', checkPermission('item_groups.update'), ItemGroupController.updateItemGroup);
router.delete('/:id', checkPermission('item_groups.delete'), ItemGroupController.deleteItemGroup);

export default router; 