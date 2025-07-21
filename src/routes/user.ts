import express from 'express';
import * as UserController from '../controllers/user';
import { protect, isOwner } from '../middleware/auth';

const router = express.Router();

// Protect all routes
// router.use(protect);

// Owner-only routes
router.post('/', UserController.createUser);
router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

// All authenticated users
// router.get('/me', UserController.getMe);

export default router;