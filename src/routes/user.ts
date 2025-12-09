import express from 'express';
import * as UserController from '../controllers/user';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD routes - owner only
router.post('/', roleMiddleware('owner'), UserController.createUser);
router.get('/', roleMiddleware('owner', 'admin'), UserController.getUsers);
router.get('/:id', roleMiddleware('owner', 'admin'), UserController.getUserById);
router.put('/:id', roleMiddleware('owner'), UserController.updateUser);
router.delete('/:id', roleMiddleware('owner'), UserController.deleteUser);

export default router;