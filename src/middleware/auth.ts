import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user';
import { TokenPayload } from '../utils/auth';

export interface UserPayload extends TokenPayload {
    permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authentication middleware - verifies JWT and attaches user info to request
 */
export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from cookie or Authorization header
        // Handle both "Bearer <token>" and just "<token>" formats
        const authHeader = req.headers.authorization;
        const token = req.cookies?.jwt || 
                     (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader);

        if (!token) {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - No token provided' 
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Fetch user from database to ensure they still exist and are active
        const user = await UserModel.findUserById(decoded.id);

        if (!user || user.deleted_at || user.status !== 'active') {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - User not found or inactive' 
            });
            return;
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            role: user.role || 'staff',
            permissions: decoded.permissions || []
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - Invalid token' 
            });
            return;
        }
        
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - Token expired' 
            });
            return;
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
};

/**
 * Role-based authorization middleware
 * Checks if user has one of the required roles
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - Authentication required' 
            });
            return;
        }

        const userRole = req.user.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            res.status(403).json({ 
                success: false,
                error: `Forbidden - Required role: ${allowedRoles.join(' or ')}` 
            });
            return;
        }

        next();
    };
};

/**
 * Permission-based authorization middleware
 * Checks if user has the required permission
 */
export const permissionMiddleware = (requiredPermission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ 
                success: false,
                error: 'Unauthorized - Authentication required' 
            });
            return;
        }

        const userPermissions = req.user.permissions || [];
        const hasPermission = userPermissions.includes('*') || userPermissions.includes(requiredPermission);

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

// Alias for backward compatibility
export const protect = authMiddleware;
export const isOwner = roleMiddleware('owner');