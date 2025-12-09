import express from 'express';
import * as CustomerController from '../controllers/customer';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', CustomerController.getCustomersDropdown);

// CRUD routes
router.post('/', roleMiddleware('owner', 'admin', 'manager'), CustomerController.createCustomer);
router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', roleMiddleware('owner', 'admin', 'manager'), CustomerController.updateCustomer);
router.delete('/:id', roleMiddleware('owner', 'admin'), CustomerController.deleteCustomer);

export default router;