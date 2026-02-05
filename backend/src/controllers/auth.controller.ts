/**
 * Authentication Controller
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';
import { HashUtil } from '../utils/security/hash.util';
import { JWTUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/security/password.util';

export class AuthController {
    /**
     * Register new user
     */
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, fullName, role, companyName, phone } = req.body;

            // Validate input
            if (!email || !password || !fullName || !role) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ error: 'Invalid email format' });
                return;
            }

            // Validate role
            if (!['admin', 'vendor', 'approver'].includes(role)) {
                res.status(400).json({ error: 'Invalid role' });
                return;
            }

            // Check password strength
            const passwordAnalysis = PasswordUtil.analyzeStrength(password);
            if (passwordAnalysis.score < 4) {
                res.status(400).json({
                    error: 'Password too weak',
                    analysis: passwordAnalysis
                });
                return;
            }

            // Check if user already exists
            const existingUser = await Database.get('SELECT id FROM users WHERE email = ?', [email]);

            if (existingUser) {
                res.status(409).json({ error: 'User already exists' });
                return;
            }

            // Hash password
            const passwordHash = await HashUtil.hashPassword(password);

            // Insert user
            const result = await Database.run(
                `INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [email, passwordHash, fullName, role, companyName || null, phone || null]
            );

            // Generate tokens
            const payload = {
                userId: result.lastID,
                email,
                role
            };

            const accessToken = JWTUtil.generateAccessToken(payload);
            const refreshToken = JWTUtil.generateRefreshToken(payload);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: result.lastID,
                    email,
                    fullName,
                    role,
                    companyName
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Login user
     */
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: 'Email and password required' });
                return;
            }

            // Get user from database
            const user = await Database.get<any>(
                'SELECT * FROM users WHERE email = ? AND is_active = 1',
                [email]
            );

            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Verify password
            const isValidPassword = await HashUtil.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate tokens
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = JWTUtil.generateAccessToken(payload);
            const refreshToken = JWTUtil.generateRefreshToken(payload);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    companyName: user.company_name
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Refresh access token
     */
    static async refresh(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({ error: 'Refresh token required' });
                return;
            }

            // Verify refresh token
            const payload = JWTUtil.verifyRefreshToken(refreshToken);

            // Generate new access token
            const newAccessToken = JWTUtil.generateAccessToken(payload);

            res.json({
                accessToken: newAccessToken
            });
        } catch (error) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const user = await Database.get<any>('SELECT * FROM users WHERE id = ?', [req.user.userId]);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                companyName: user.company_name,
                phone: user.phone,
                createdAt: user.created_at
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Change password
     */
    static async changePassword(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({ error: 'Current and new password required' });
                return;
            }

            // Get user
            const user = await Database.get<any>('SELECT * FROM users WHERE id = ?', [req.user.userId]);

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Verify current password
            const isValid = await HashUtil.verifyPassword(currentPassword, user.password_hash);

            if (!isValid) {
                res.status(401).json({ error: 'Current password incorrect' });
                return;
            }

            // Check new password strength
            const passwordAnalysis = PasswordUtil.analyzeStrength(newPassword);
            if (passwordAnalysis.score < 4) {
                res.status(400).json({
                    error: 'New password too weak',
                    analysis: passwordAnalysis
                });
                return;
            }

            // Hash new password
            const newPasswordHash = await HashUtil.hashPassword(newPassword);

            // Update password
            await Database.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
                newPasswordHash,
                req.user.userId
            ]);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
