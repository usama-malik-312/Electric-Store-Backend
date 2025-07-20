import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { UserPayload } from '../types/express';
export interface UserPayload {
    id: number;
    role?: string; // Make role optional if needed
    // Add other user fields as needed
}
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

export const protect = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

        req.user = {
            id: decoded.id,
            role: decoded.role || 'user' // Provide default role if undefined
        };

        next();
    } catch (error) {
        console.error('JWT error:', error);
        res.status(401).json({ error: 'Not authorized' });
    }
};
export const isOwner = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Not authorized as owner' });
    }
    next();
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};