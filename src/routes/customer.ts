import express from 'express';
import * as CustomerController from '../controllers/customer';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, CustomerController.createCustomer);
router.get('/', protect, CustomerController.getCustomers);
router.get('/:id', protect, CustomerController.getCustomer);
router.put('/:id', protect, CustomerController.updateCustomer);
router.delete('/:id', protect, CustomerController.deleteCustomer);

export default router;