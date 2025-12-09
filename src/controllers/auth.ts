import { Request, Response } from 'express';
import * as UserModel from '../models/user';
import { 
    comparePasswords, 
    generateToken, 
    generateRefreshToken,
    setAuthCookie, 
    clearAuthCookies,
    getRolePermissions 
} from '../utils/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import pool from '../config/db';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phone, password, role } = req.body;

        if (!email && !phone) {
            res.status(400).json({ 
                success: false,
                error: 'Email or phone required' 
            });
            return;
        }

        if (!password || password.length < 6) {
            res.status(400).json({ 
                success: false,
                error: 'Password must be at least 6 characters long' 
            });
            return;
        }

        // Check if user already exists
        const existingUser = await UserModel.findUserByEmailOrPhone(email || phone);
        if (existingUser) {
            res.status(409).json({ 
                success: false,
                error: 'User with this email or phone already exists' 
            });
            return;
        }

        // Create user (only owners can create users with roles other than staff)
        const user = await UserModel.createUser({
            email, 
            password,
            first_name: '',
            last_name: '',
            phone: phone || '',
            role: role || 'staff'
        });

        // Generate tokens
        const permissions = getRolePermissions(user.role);
        const token = generateToken({
            id: user.id,
            role: user.role,
            permissions
        });
        const refreshToken = generateRefreshToken(user.id);

        // Set cookies
        setAuthCookie(res, token, refreshToken);

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    full_name: user.full_name,
                },
                token,
                refreshToken
            }
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // PostgreSQL unique violation
            res.status(409).json({ 
                success: false,
                error: 'User with this email or phone already exists' 
            });
            return;
        }
        res.status(500).json({ 
            success: false,
            error: 'Registration failed' 
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            res.status(400).json({ 
                success: false,
                error: 'Identifier (email/phone) and password are required' 
            });
            return;
        }

        const user = await UserModel.findUserByEmailOrPhone(identifier);

        if (!user) {
            res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
            return;
        }

        // Check if user is active
        if (user.status !== 'active' || user.deleted_at) {
            res.status(401).json({ 
                success: false,
                error: 'Account is inactive or deleted' 
            });
            return;
        }

        // Verify password
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
            return;
        }

        // Generate tokens with role and permissions
        const permissions = getRolePermissions(user.role);
        const token = generateToken({
            id: user.id,
            role: user.role,
            permissions
        });
        const refreshToken = generateRefreshToken(user.id);

        // Set cookies
        setAuthCookie(res, token, refreshToken);

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    full_name: user.full_name,
                    store_id: user.store_id,
                },
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Login failed' 
        });
    }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        clearAuthCookies(res);
        res.status(200).json({ 
            success: true,
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Logout failed' 
        });
    }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ 
                success: false,
                error: 'Not authenticated' 
            });
            return;
        }

        const user = await UserModel.findUserById(req.user.id);
        if (!user) {
            res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
            return;
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                full_name: user.full_name,
                first_name: user.first_name,
                last_name: user.last_name,
                store_id: user.store_id,
                status: user.status,
                profile_image: user.profile_image,
                permissions: req.user.permissions
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch user' 
        });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            res.status(401).json({ 
                success: false,
                error: 'Refresh token required' 
            });
            return;
        }

        const { verifyRefreshToken, generateToken, getRolePermissions } = await import('../utils/auth');
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            res.status(401).json({ 
                success: false,
                error: 'Invalid or expired refresh token' 
            });
            return;
        }

        // Fetch user to get current role
        const user = await UserModel.findUserById(decoded.id);

        if (!user || user.deleted_at || user.status !== 'active') {
            res.status(401).json({ 
                success: false,
                error: 'User not found or inactive' 
            });
            return;
        }

        // Generate new access token
        const permissions = getRolePermissions(user.role);
        const newToken = generateToken({
            id: user.id,
            role: user.role,
            permissions
        });

        res.json({
            success: true,
            data: {
                token: newToken
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to refresh token' 
        });
    }
};
