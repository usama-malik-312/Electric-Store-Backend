import express from 'express';
import * as CustomerController from '../controllers/customer';
// import { } from '../middleware/auth';

const router = express.Router();

router.post('/', CustomerController.createCustomer);
router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

export default router;