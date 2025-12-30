import express from 'express';
import * as BrandController from '../controllers/brand';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', BrandController.getBrandsDropdown);

// CRUD routes - all authenticated users can access
router.post('/', BrandController.createBrand);
router.get('/', BrandController.getBrands);
router.get('/:id', BrandController.getBrand);
router.put('/:id', BrandController.updateBrand);
router.delete('/:id', BrandController.deleteBrand);

export default router;