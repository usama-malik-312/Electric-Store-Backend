import express from 'express';
import * as UserController from '../controllers/user';
import { protect, isOwner } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(protect);

// Owner-only routes
router.post('/', isOwner, UserController.createUser);
router.get('/', isOwner, UserController.getUsers);

// All authenticated users
router.get('/me', UserController.getMe);

export default router;