import express from 'express';
import * as StoreController from '../controllers/store';
import { isOwner } from '../middleware/auth';

const router = express.Router();

router.post('/', StoreController.createStore);
router.get('/', StoreController.getStores);
// router.get('/:id', StoreController.getStore);
// router.put('/:id', StoreController.updateStore);
router.delete('/:id', StoreController.deleteStore);

export default router;