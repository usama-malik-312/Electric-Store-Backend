import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Permission-based authorization middleware
 * Checks if user has the required permission
 * 
 * Usage: checkPermission('brands.create')
 */
export const checkPermission = (requiredPermission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Authentication required'
            });
            return;
        }

        const userPermissions = req.user.permissions || [];

        // Owner role has '*' permission (full access)
        if (userPermissions.includes('*')) {
            next();
            return;
        }

        // Check if user has the required permission
        const hasPermission = userPermissions.includes(requiredPermission);

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                error: `Forbidden - Required permission: ${requiredPermission}`
            });
            return;
        }

        next();
    };
};

/**
 * Check multiple permissions (user needs at least one)
 * Usage: checkAnyPermission(['brands.create', 'brands.update'])
 */
export const checkAnyPermission = (requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Authentication required'
            });
            return;
        }

        const userPermissions = req.user.permissions || [];

        // Owner role has '*' permission (full access)
        if (userPermissions.includes('*')) {
            next();
            return;
        }

        // Check if user has at least one of the required permissions
        const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                error: `Forbidden - Required permission: ${requiredPermissions.join(' or ')}`
            });
            return;
        }

        next();
    };
};

/**
 * Check multiple permissions (user needs all)
 * Usage: checkAllPermissions(['brands.create', 'brands.update'])
 */
export const checkAllPermissions = (requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Authentication required'
            });
            return;
        }

        const userPermissions = req.user.permissions || [];

        // Owner role has '*' permission (full access)
        if (userPermissions.includes('*')) {
            next();
            return;
        }

        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));

        if (!hasAllPermissions) {
            const missing = requiredPermissions.filter(perm => !userPermissions.includes(perm));
            res.status(403).json({
                success: false,
                error: `Forbidden - Missing permissions: ${missing.join(', ')}`
            });
            return;
        }

        next();
    };
};

