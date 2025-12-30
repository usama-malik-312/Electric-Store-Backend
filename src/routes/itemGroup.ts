import express from 'express';
import * as ItemGroupController from '../controllers/itemGroup';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', ItemGroupController.getItemGroupsDropdown);

// CRUD routes - all authenticated users can access
router.post('/', ItemGroupController.createItemGroup);
router.get('/', ItemGroupController.getItemGroups);
router.get('/:id', ItemGroupController.getItemGroupById);
router.put('/:id', ItemGroupController.updateItemGroup);
router.delete('/:id', ItemGroupController.deleteItemGroup);

export default router; 