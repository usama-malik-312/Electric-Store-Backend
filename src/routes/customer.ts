import express from 'express';
import * as CustomerController from '../controllers/customer';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dropdown endpoint (before /:id route)
router.get('/dropdown', checkPermission('customers.read'), CustomerController.getCustomersDropdown);

// CRUD routes with permission checks
router.post('/', checkPermission('customers.create'), CustomerController.createCustomer);
router.get('/', checkPermission('customers.read'), CustomerController.getCustomers);
router.get('/:id', checkPermission('customers.read'), CustomerController.getCustomer);
router.put('/:id', checkPermission('customers.update'), CustomerController.updateCustomer);
router.delete('/:id', checkPermission('customers.delete'), CustomerController.deleteCustomer);

export default router;