import { Request, Response } from 'express';
import * as UserModel from '../models/user';
import * as RoleModel from '../models/role';
import { 
    comparePasswords, 
    generateToken, 
    generateRefreshToken,
    setAuthCookie, 
    clearAuthCookies
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

        // Get role_id from role name if provided, otherwise default to staff
        let roleId: number | null = null;
        if (role) {
            const roleData = await RoleModel.getRoleByName(role);
            if (roleData) {
                roleId = roleData.id!;
            }
        }
        
        // If no role_id found, get staff role as default
        if (!roleId) {
            const staffRole = await RoleModel.getRoleByName('staff');
            roleId = staffRole?.id || null;
        }

        // Create user with role_id
        const userData: any = {
            email, 
            password,
            first_name: '',
            last_name: '',
            phone: phone || '',
            role: role || 'staff'
        };
        
        // Add role_id if we have it
        if (roleId) {
            userData.role_id = roleId;
        }

        const user = await UserModel.createUser(userData);

        // Get user role and permissions from database
        let permissions: string[] = [];
        let roleName = user.role || 'staff';
        
        if (user.id && roleId) {
            const roleData = await RoleModel.getUserRoleAndPermissions(user.id);
            if (roleData) {
                permissions = (roleData.permissions || []).map((p: any) => p.code);
                roleName = roleData.name;
            }
        }

        // Generate tokens
        const token = generateToken({
            id: user.id!,
            role: roleName,
            permissions
        });
        const refreshToken = generateRefreshToken(user.id!);

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
                    role: roleName,
                    role_id: roleId,
                    full_name: user.full_name,
                },
                token,
                refreshToken,
                permissions
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

        // Get user role and permissions from database
        const roleData = await RoleModel.getUserRoleAndPermissions(user.id!);
        
        if (!roleData) {
            res.status(500).json({
                success: false,
                error: 'User role not found'
            });
            return;
        }

        // Extract permission codes
        const permissions = (roleData.permissions || []).map((p: any) => p.code);
        const roleName = roleData.name;

        // Generate tokens with role and permissions
        const token = generateToken({
            id: user.id!,
            role: roleName,
            permissions
        });
        const refreshToken = generateRefreshToken(user.id!);

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
                    role: roleName,
                    role_id: roleData.id,
                    full_name: user.full_name,
                    store_id: user.store_id,
                },
                token,
                refreshToken,
                permissions
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

        // Get role information
        const roleData = await RoleModel.getUserRoleAndPermissions(user.id!);
        const permissions = roleData ? (roleData.permissions || []).map((p: any) => p.code) : [];

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: roleData?.name || user.role,
                role_id: roleData?.id || null,
                full_name: user.full_name,
                first_name: user.first_name,
                last_name: user.last_name,
                store_id: user.store_id,
                status: user.status,
                profile_image: user.profile_image,
                permissions: permissions.length > 0 ? permissions : req.user.permissions || []
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

        // Fetch user to get current role and permissions
        const user = await UserModel.findUserById(decoded.id);

        if (!user || user.deleted_at || user.status !== 'active') {
            res.status(401).json({ 
                success: false,
                error: 'User not found or inactive' 
            });
            return;
        }

        // Get user permissions from database
        const roleData = await RoleModel.getUserRoleAndPermissions(user.id!);
        
        if (!roleData) {
            res.status(500).json({
                success: false,
                error: 'User role not found'
            });
            return;
        }

        const permissions = (roleData.permissions || []).map((p: any) => p.code);
        const roleName = roleData.name;

        // Generate new access token
        const newToken = generateToken({
            id: user.id!,
            role: roleName,
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
