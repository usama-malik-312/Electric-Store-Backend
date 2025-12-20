import { Response } from 'express';
import * as RoleModel from '../models/role';
import { AuthenticatedRequest } from '../middleware/auth';
import { getPaginationParams, buildPaginationResponse, getSortParams } from '../utils/pagination';

export const getAllRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { page, limit } = getPaginationParams(req);
        const search = req.query.search as string | undefined;
        const sort = getSortParams(req, 'name ASC');
        
        // For now, return all roles (can add pagination later if needed)
        const roles = await RoleModel.getAllRoles();
        
        // Apply search filter if provided
        let filteredRoles = roles;
        if (search) {
            filteredRoles = roles.filter((role: any) => 
                role.name.toLowerCase().includes(search.toLowerCase()) ||
                (role.description && role.description.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Apply sorting
        const sortField = sort.replace(' ASC', '').replace(' DESC', '').replace(/[^a-zA-Z0-9_]/g, '');
        const sortDirection = sort.includes('DESC') ? 'DESC' : 'ASC';
        filteredRoles.sort((a: any, b: any) => {
            const aVal = a[sortField] || '';
            const bVal = b[sortField] || '';
            return sortDirection === 'ASC' 
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });

        // Apply pagination
        const offset = (page - 1) * limit;
        const paginatedRoles = filteredRoles.slice(offset, offset + limit);

        res.json({
            success: true,
            ...buildPaginationResponse(paginatedRoles, filteredRoles.length, page, limit)
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch roles'
        });
    }
};

export const getRoleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role ID'
            });
            return;
        }

        const role = await RoleModel.getRoleById(id);
        if (!role) {
            res.status(404).json({
                success: false,
                error: 'Role not found'
            });
            return;
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch role'
        });
    }
};

export const createRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { name, description } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Role name is required'
            });
            return;
        }

        // Check if role already exists
        const existingRole = await RoleModel.getRoleByName(name);
        if (existingRole) {
            res.status(409).json({
                success: false,
                error: 'Role with this name already exists'
            });
            return;
        }

        const role = await RoleModel.createRole({
            name: name.trim(),
            description: description?.trim() || null,
            is_system: false
        });

        res.status(201).json({
            success: true,
            data: role
        });
    } catch (error: any) {
        console.error('Error creating role:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({
                success: false,
                error: 'Role with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create role'
        });
    }
};

export const updateRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role ID'
            });
            return;
        }

        const { name, description } = req.body;
        const updates: any = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Role name must be a non-empty string'
                });
                return;
            }
            updates.name = name.trim();
        }

        if (description !== undefined) {
            updates.description = description?.trim() || null;
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
            return;
        }

        // Check if name conflicts with existing role
        if (updates.name) {
            const existingRole = await RoleModel.getRoleByName(updates.name);
            if (existingRole && existingRole.id !== id) {
                res.status(409).json({
                    success: false,
                    error: 'Role with this name already exists'
                });
                return;
            }
        }

        const updatedRole = await RoleModel.updateRole(id, updates);
        if (!updatedRole) {
            res.status(404).json({
                success: false,
                error: 'Role not found or is a system role'
            });
            return;
        }

        res.json({
            success: true,
            data: updatedRole
        });
    } catch (error: any) {
        console.error('Error updating role:', error);
        if (error.code === '23505') {
            res.status(409).json({
                success: false,
                error: 'Role with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update role'
        });
    }
};

export const deleteRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role ID'
            });
            return;
        }

        await RoleModel.deleteRole(id);

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        
        if (error.message === 'Role not found') {
            res.status(404).json({
                success: false,
                error: error.message
            });
            return;
        }

        if (error.message === 'Cannot delete system role' || error.message === 'Cannot delete role with assigned users') {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete role'
        });
    }
};

export const getRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role ID'
            });
            return;
        }

        const role = await RoleModel.getRoleById(id);
        if (!role) {
            res.status(404).json({
                success: false,
                error: 'Role not found'
            });
            return;
        }

        const permissions = await RoleModel.getAllPermissionsWithRoleAssignment(id);

        res.json({
            success: true,
            data: {
                role: {
                    id: role.id,
                    name: role.name,
                    description: role.description
                },
                permissions: permissions.map((p: any) => ({
                    id: p.id,
                    module: p.module,
                    action: p.action,
                    code: p.code,
                    assigned: p.assigned
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch role permissions'
        });
    }
};

export const updateRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role ID'
            });
            return;
        }

        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            res.status(400).json({
                success: false,
                error: 'Permissions must be an array of permission codes'
            });
            return;
        }

        // Validate permission codes format
        const invalidCodes = permissions.filter((code: any) => 
            typeof code !== 'string' || !code.includes('.')
        );

        if (invalidCodes.length > 0) {
            res.status(400).json({
                success: false,
                error: `Invalid permission codes: ${invalidCodes.join(', ')}`
            });
            return;
        }

        // Check if role exists
        const role = await RoleModel.getRoleById(id);
        if (!role) {
            res.status(404).json({
                success: false,
                error: 'Role not found'
            });
            return;
        }

        // Update role permissions
        await RoleModel.setRolePermissions(id, permissions);

        // Get updated permissions
        const updatedPermissions = await RoleModel.getRolePermissions(id);

        res.json({
            success: true,
            data: {
                role: {
                    id: role.id,
                    name: role.name
                },
                permissions: updatedPermissions.map((p: any) => ({
                    code: p.code,
                    module: p.module,
                    action: p.action
                }))
            },
            message: 'Role permissions updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating role permissions:', error);
        
        if (error.message && error.message.includes('not found')) {
            res.status(400).json({
                success: false,
                error: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update role permissions'
        });
    }
};

