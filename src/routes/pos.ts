import express from 'express';
import * as POSController from '../controllers/pos';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Sales routes
// GET /api/pos/sales - Get paginated sales (requires pos.read permission)
router.get('/sales', checkPermission('pos.read'), POSController.getSales);

// GET /api/pos/sales/:id - Get sale by ID (requires pos.read permission)
router.get('/sales/:id', checkPermission('pos.read'), POSController.getSale);

// POST /api/pos/sales - Create new sale (requires pos.create permission)
router.post('/sales', checkPermission('pos.create'), POSController.createSale);

// POST /api/pos/sales/:id/cancel - Cancel a sale (requires pos.update permission)
router.post('/sales/:id/cancel', checkPermission('pos.update'), POSController.cancelSale);

// GET /api/pos/statistics - Get sales statistics (requires pos.read permission)
router.get('/statistics', checkPermission('pos.read'), POSController.getSalesStatistics);

export default router;

