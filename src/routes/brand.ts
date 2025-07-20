import express from 'express';
import * as BrandController from '../controllers/brand';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, BrandController.createBrand);
router.get('/', protect, BrandController.getBrands);
router.get('/:id', protect, BrandController.getBrand);
router.put('/:id', protect, BrandController.updateBrand);
router.delete('/:id', protect, BrandController.deleteBrand);

export default router;