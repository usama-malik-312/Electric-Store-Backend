import { Request, Response } from 'express';
import * as UserModel from '../models/user';
import { comparePasswords, generateToken, setAuthCookie } from '../utils/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phone, password, role } = req.body;

        if (!email && !phone) {
            res.status(400).json({ error: 'Email or phone required' });
            return;
        }

        const user = await UserModel.createUser({ email, phone, password, role });
        const token = generateToken(user.id);

        setAuthCookie(res, token);
        res.status(201).json({ user, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body;
        const user = await UserModel.findUserByEmailOrPhone(identifier);

        if (!user || !(await comparePasswords(password, user.password))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user.id);
        setAuthCookie(res, token);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// src/controllers/auth.ts
// export const getMe = async (req: Request, res: Response) => {
//     try {
//         if (!req.user) {
//             res.status(401).json({ error: 'Not authenticated' });
//             return;
//         }

//         const user = await UserModel.findUserById(req.user.id);
//         if (!user) {
//             res.status(404).json({ error: 'User not found' });
//             return;
//         }

//         res.json({
//             id: user.id,
//             email: user.email,
//             role: user.role
//             // Don't send password or sensitive fields
//         });
//     } catch (error) {
//         console.error('Get user error:', error);
//         res.status(500).json({ error: 'Failed to fetch user' });
//     }
// };

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.clearCookie('token'); // assuming you're using a cookie-based token
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
