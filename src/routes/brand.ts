import express from 'express';
import * as BrandController from '../controllers/brand';
// import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', BrandController.createBrand);
router.get('/', BrandController.getBrands);
router.get('/:id', BrandController.getBrand);
router.put('/:id', BrandController.updateBrand);
router.delete('/:id', BrandController.deleteBrand);

export default router;