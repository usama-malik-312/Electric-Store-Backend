import express from 'express';
import * as BrandController from '../controllers/brand';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', BrandController.getBrandsDropdown);

// CRUD routes
router.post('/', roleMiddleware('owner', 'admin', 'manager'), BrandController.createBrand);
router.get('/', BrandController.getBrands);
router.get('/:id', BrandController.getBrand);
router.put('/:id', roleMiddleware('owner', 'admin', 'manager'), BrandController.updateBrand);
router.delete('/:id', roleMiddleware('owner', 'admin'), BrandController.deleteBrand);

export default router;