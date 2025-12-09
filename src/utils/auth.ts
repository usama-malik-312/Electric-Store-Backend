// src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
    id: number;
    role?: string;
    permissions?: string[];
}

// Generate access token with role and permissions
export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
};

// Generate refresh token
export const generateRefreshToken = (userId: number): string => {
    return jwt.sign(
        { id: userId },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { id: number } | null => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number };
    } catch (error) {
        return null;
    }
};

// Get permissions based on role
export const getRolePermissions = (role?: string): string[] => {
    // For now, owner has full access
    // This can be extended later with a permissions table
    const rolePermissions: Record<string, string[]> = {
        owner: ['*'], // Full access
        admin: ['read:*', 'write:*', 'delete:*'],
        manager: ['read:*', 'write:*'],
        staff: ['read:*'],
    };

    return rolePermissions[role || 'staff'] || [];
};

// Hash password
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 12);
};

// Compare passwords
export const comparePasswords = async (candidatePassword: string, hashedPassword: string) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Set auth cookie
export const setAuthCookie = (res: Response, token: string, refreshToken?: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    // For development, use 'lax' which works for same-site requests
    // For production with cross-origin, use 'none' with secure: true
    // Note: 'none' requires secure: true (HTTPS) in production
    const sameSiteOption: 'strict' | 'lax' | 'none' = isProduction ? 'none' : 'lax';
    
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: isProduction, // Must be true for sameSite: 'none'
        sameSite: sameSiteOption,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/'
    });

    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: sameSiteOption,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });
    }
};

// Clear auth cookies
export const clearAuthCookies = (res: Response) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSiteOption: 'strict' | 'lax' | 'none' = isProduction ? 'none' : 'lax';
    
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: isProduction,
        sameSite: sameSiteOption,
        path: '/'
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: sameSiteOption,
        path: '/'
    });
};