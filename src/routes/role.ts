import express from 'express';
import * as RoleController from '../controllers/role';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/roles - Get all roles
router.get('/', RoleController.getAllRoles);

// GET /api/roles/:id - Get role by ID
router.get('/:id', RoleController.getRoleById);

// POST /api/roles - Create new role
router.post('/', RoleController.createRole);

// PUT /api/roles/:id - Update role
router.put('/:id', RoleController.updateRole);

// DELETE /api/roles/:id - Delete role
router.delete('/:id', RoleController.deleteRole);

// GET /api/roles/:id/permissions - Get role permissions
router.get('/:id/permissions', RoleController.getRolePermissions);

// POST /api/roles/:id/permissions - Update role permissions
router.post('/:id/permissions', RoleController.updateRolePermissions);

export default router;

