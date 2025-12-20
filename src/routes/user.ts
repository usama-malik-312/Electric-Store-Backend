import express from 'express';
import * as UserController from '../controllers/user';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD routes with permission checks
router.post('/', checkPermission('users.create'), UserController.createUser);
router.get('/', checkPermission('users.read'), UserController.getUsers);
router.get('/:id', checkPermission('users.read'), UserController.getUserById);
router.put('/:id', checkPermission('users.update'), UserController.updateUser);
router.delete('/:id', checkPermission('users.delete'), UserController.deleteUser);

export default router;