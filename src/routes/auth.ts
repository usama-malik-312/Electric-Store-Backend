import express from 'express';
import * as AuthController from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);
// router.get('/me', authenticate, AuthController.getMe);

export default router;