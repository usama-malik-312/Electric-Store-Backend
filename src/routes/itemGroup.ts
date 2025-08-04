import express from 'express';
import * as ItemGroupController from '../controllers/itemGroup';
// import { protect, isOwner } from '../middleware/auth';

const router = express.Router();

// Protect all routes
// router.use(protect);

// Owner-only routes
router.post('/', ItemGroupController.createItemGroup);
router.get('/', ItemGroupController.getItemGroups);
router.get('/:id', ItemGroupController.getItemGroupById);
router.put('/:id', ItemGroupController.updateItemGroup);
router.delete('/:id', ItemGroupController.deleteItemGroup);

export default router; 