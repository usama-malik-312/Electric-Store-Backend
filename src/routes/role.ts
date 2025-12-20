import express from 'express';
import * as RoleController from '../controllers/role';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/roles - Get all roles (owner, admin can view)
router.get('/', roleMiddleware('owner', 'admin'), RoleController.getAllRoles);

// GET /api/roles/:id - Get role by ID
router.get('/:id', roleMiddleware('owner', 'admin'), RoleController.getRoleById);

// POST /api/roles - Create new role (owner only)
router.post('/', roleMiddleware('owner'), RoleController.createRole);

// PUT /api/roles/:id - Update role (owner only)
router.put('/:id', roleMiddleware('owner'), RoleController.updateRole);

// DELETE /api/roles/:id - Delete role (owner only)
router.delete('/:id', roleMiddleware('owner'), RoleController.deleteRole);

// GET /api/roles/:id/permissions - Get role permissions
router.get('/:id/permissions', roleMiddleware('owner', 'admin'), RoleController.getRolePermissions);

// POST /api/roles/:id/permissions - Update role permissions
router.post('/:id/permissions', roleMiddleware('owner'), RoleController.updateRolePermissions);

export default router;

