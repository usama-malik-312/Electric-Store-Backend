import express from 'express';
import * as BrandController from '../controllers/brand';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('brands.read'), BrandController.getBrandsDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('brands.create'), BrandController.createBrand);
router.get('/', checkPermission('brands.read'), BrandController.getBrands);
router.get('/:id', checkPermission('brands.read'), BrandController.getBrand);
router.put('/:id', checkPermission('brands.update'), BrandController.updateBrand);
router.delete('/:id', checkPermission('brands.delete'), BrandController.deleteBrand);

export default router;