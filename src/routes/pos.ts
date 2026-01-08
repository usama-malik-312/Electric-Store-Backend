import express from 'express';
import * as SaleController from '../controllers/sale';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Sales routes
router.post('/sales', SaleController.createSale);
router.get('/sales', SaleController.getAllSales);
router.get('/sales/:id', SaleController.getSale);

export default router;

