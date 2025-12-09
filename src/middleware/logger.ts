import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Logging middleware
 * Logs all requests with method, path, IP, user (if authenticated), and timestamp
 */
export const logger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Get user info if authenticated
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Log request
    console.log(`[${timestamp}] ${req.method} ${req.path}`, {
        ip: req.ip || req.socket.remoteAddress,
        userId,
        userRole,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${timestamp}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
            userId,
            userRole,
        });
    });

    next();
};

