/**
 * Authentication Controller
 */

import { Request, Response } from 'express';
import { Database } from '../database/database';
import { HashUtil } from '../utils/security/hash.util';
import { JWTUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/security/password.util';
import { PasswordHistoryUtil } from '../utils/security/password-history.util';
import { OTPUtil } from '../utils/otp.util';
import { EmailService } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

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

            // Calculate password expiration date
            const passwordExpiresAt = PasswordHistoryUtil.calculateExpirationDate();

            // Insert user
            const result = await Database.run(
                `INSERT INTO users (email, password_hash, full_name, role, company_name, phone, password_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, passwordHash, fullName, role, companyName || null, phone || null, passwordExpiresAt.toISOString()]
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
            const ipAddress = req.ip || req.socket.remoteAddress;

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
                // Log failed login attempt
                await Database.run(
                    `INSERT INTO security_events (event_type, severity, ip_address, user_agent, details)
                     VALUES (?, ?, ?, ?, ?)`,
                    ['failed_login', 'medium', ipAddress, req.headers['user-agent'], `Failed login for email: ${email}`]
                );
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const unlockTime = new Date(user.locked_until);
                const minutesLeft = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
                res.status(403).json({
                    error: 'Account is temporarily locked',
                    lockedUntil: user.locked_until,
                    message: `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
                });
                return;
            }

            // Reset lock if time has passed
            if (user.locked_until && new Date(user.locked_until) <= new Date()) {
                await Database.run(
                    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                    [user.id]
                );
            }

            // Verify password
            const isValidPassword = await HashUtil.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                // Increment failed attempts
                const failedAttempts = (user.failed_login_attempts || 0) + 1;
                const maxAttempts = 5;

                if (failedAttempts >= maxAttempts) {
                    // Lock account for 30 minutes
                    const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                    await Database.run(
                        'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                        [failedAttempts, lockUntil.toISOString(), user.id]
                    );

                    // Log account locked event
                    await Database.run(
                        `INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [user.id, 'account_locked', 'high', ipAddress, req.headers['user-agent'], `Account locked after ${failedAttempts} failed attempts`]
                    );

                    res.status(403).json({
                        error: 'Account locked',
                        message: 'Too many failed login attempts. Account locked for 30 minutes.'
                    });
                } else {
                    await Database.run(
                        'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
                        [failedAttempts, user.id]
                    );

                    // Log failed attempt
                    await Database.run(
                        `INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [user.id, 'failed_login', 'medium', ipAddress, req.headers['user-agent'], `Failed login attempt ${failedAttempts}/${maxAttempts}`]
                    );

                    res.status(401).json({
                        error: 'Invalid credentials',
                        attemptsRemaining: maxAttempts - failedAttempts
                    });
                }
                return;
            }

            // Reset failed attempts on successful login
            await Database.run(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                [user.id]
            );

            // Check password expiration
            if (user.password_expires_at && new Date(user.password_expires_at) < new Date()) {
                res.status(403).json({
                    error: 'Password expired',
                    message: 'Your password has expired. Please reset your password.',
                    requiresPasswordChange: true
                });
                return;
            }

            // Check if password expiring soon (within 7 days)
            const passwordExpiryWarning = user.password_expires_at
                ? Math.ceil((new Date(user.password_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

            // Check if MFA is enabled
            if (user.mfa_enabled) {
                res.json({
                    message: 'MFA required',
                    requires2FA: true,
                    tempToken: JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role }, '5m') // 5 minute temp token
                });
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

            const response: any = {
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
            };

            // Add password expiry warning if applicable
            if (passwordExpiryWarning !== null && passwordExpiryWarning <= 7 && passwordExpiryWarning > 0) {
                response.passwordExpiringIn = passwordExpiryWarning;
                response.warning = `Your password will expire in ${passwordExpiryWarning} day(s)`;
            }

            res.json(response);
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
            const ipAddress = req.ip || req.socket.remoteAddress;

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

            // Check if password was used before
            const isReused = await PasswordHistoryUtil.isPasswordReused(req.user.userId, newPassword);
            if (isReused) {
                res.status(400).json({
                    error: 'Password reuse not allowed',
                    message: 'You cannot reuse any of your last 5 passwords. Please choose a different password.'
                });
                return;
            }

            // Add current password to history
            await PasswordHistoryUtil.addToHistory(req.user.userId, user.password_hash);

            // Hash new password
            const newPasswordHash = await HashUtil.hashPassword(newPassword);

            // Calculate new expiration date
            const passwordExpiresAt = PasswordHistoryUtil.calculateExpirationDate();

            // Update password and expiration
            await Database.run(
                `UPDATE users 
                 SET password_hash = ?, 
                     password_changed_at = CURRENT_TIMESTAMP, 
                     password_expires_at = ?,
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [newPasswordHash, passwordExpiresAt.toISOString(), req.user.userId]
            );

            //Log security event
            await Database.run(
                `INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.userId, 'password_changed', 'medium', ipAddress, req.headers['user-agent'], 'Password changed successfully']
            );

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Initiate signup - Send OTP to email
     */
    static async initiateSignup(req: Request, res: Response): Promise<void> {
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

            // Generate temporary token
            const tempToken = uuidv4();

            // Store OTP with user data
            const otp = OTPUtil.storeOTP(tempToken, email, 'signup', {
                email,
                password,
                fullName,
                role,
                companyName,
                phone
            });

            // Send OTP email
            await EmailService.sendOTPEmail(email, otp, 'signup', fullName);

            res.status(200).json({
                message: 'OTP sent to your email',
                tempToken,
                expiresIn: 300 // 5 minutes
            });
        } catch (error) {
            console.error('Initiate signup error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Verify signup OTP and create user
     */
    static async verifySignupOTP(req: Request, res: Response): Promise<void> {
        try {
            const { tempToken, otp } = req.body;

            if (!tempToken || !otp) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            // Verify OTP
            const verification = OTPUtil.verifyOTP(tempToken, otp);

            if (!verification.success) {
                res.status(400).json({ error: verification.error });
                return;
            }

            const userData = verification.data!.data;

            // Hash password
            const passwordHash = await HashUtil.hashPassword(userData.password);

            // Calculate password expiration date
            const passwordExpiresAt = PasswordHistoryUtil.calculateExpirationDate();

            // Insert user
            const result = await Database.run(
                `INSERT INTO users (email, password_hash, full_name, role, company_name, phone, password_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.email,
                    passwordHash,
                    userData.fullName,
                    userData.role,
                    userData.companyName || null,
                    userData.phone || null,
                    passwordExpiresAt.toISOString()
                ]
            );

            // Send welcome email
            await EmailService.sendWelcomeEmail(userData.email, userData.fullName, userData.role);

            // Generate tokens
            const payload = {
                userId: result.lastID,
                email: userData.email,
                role: userData.role
            };

            const accessToken = JWTUtil.generateAccessToken(payload);
            const refreshToken = JWTUtil.generateRefreshToken(payload);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: result.lastID,
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.role,
                    companyName: userData.companyName
                },
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Verify signup OTP error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Initiate login - Send OTP to email
     */
    static async initiateLogin(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress;

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
                // Log failed login attempt
                await Database.run(
                    `INSERT INTO security_events (event_type, severity, ip_address, user_agent, details)
                     VALUES (?, ?, ?, ?, ?)`,
                    ['failed_login', 'medium', ipAddress, req.headers['user-agent'], `Failed login for email: ${email}`]
                );
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Check if account is locked
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const unlockTime = new Date(user.locked_until);
                const minutesLeft = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
                res.status(403).json({
                    error: 'Account is temporarily locked',
                    lockedUntil: user.locked_until,
                    message: `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
                });
                return;
            }

            // Reset lock if time has passed
            if (user.locked_until && new Date(user.locked_until) <= new Date()) {
                await Database.run(
                    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                    [user.id]
                );
            }

            // Verify password
            const isValidPassword = await HashUtil.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                // Increment failed attempts
                const failedAttempts = (user.failed_login_attempts || 0) + 1;
                const maxAttempts = 5;

                if (failedAttempts >= maxAttempts) {
                    // Lock account for 30 minutes
                    const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                    await Database.run(
                        'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
                        [failedAttempts, lockUntil.toISOString(), user.id]
                    );

                    res.status(403).json({
                        error: 'Account locked',
                        message: 'Too many failed login attempts. Account locked for 30 minutes.'
                    });
                } else {
                    await Database.run(
                        'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
                        [failedAttempts, user.id]
                    );

                    res.status(401).json({
                        error: 'Invalid credentials',
                        attemptsRemaining: maxAttempts - failedAttempts
                    });
                }
                return;
            }

            // Check password expiration
            if (user.password_expires_at && new Date(user.password_expires_at) < new Date()) {
                res.status(403).json({
                    error: 'Password expired',
                    message: 'Your password has expired. Please reset your password.',
                    requiresPasswordChange: true
                });
                return;
            }

            // Generate temporary token
            const tempToken = uuidv4();

            // Store OTP
            const otp = OTPUtil.storeOTP(tempToken, email, 'login', {
                userId: user.id,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
                companyName: user.company_name
            });

            // Send OTP email
            await EmailService.sendOTPEmail(email, otp, 'login', user.full_name);

            res.status(200).json({
                message: 'OTP sent to your email',
                tempToken,
                expiresIn: 300 // 5 minutes
            });
        } catch (error) {
            console.error('Initiate login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Verify login OTP and return tokens
     */
    static async verifyLoginOTP(req: Request, res: Response): Promise<void> {
        try {
            const { tempToken, otp } = req.body;

            if (!tempToken || !otp) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            // Verify OTP
            const verification = OTPUtil.verifyOTP(tempToken, otp);

            if (!verification.success) {
                res.status(400).json({ error: verification.error });
                return;
            }

            const userData = verification.data!.data;

            // Reset failed login attempts on successful login
            await Database.run(
                'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
                [userData.userId]
            );

            // Generate tokens
            const payload = {
                userId: userData.userId,
                email: userData.email,
                role: userData.role
            };

            const accessToken = JWTUtil.generateAccessToken(payload);
            const refreshToken = JWTUtil.generateRefreshToken(payload);

            // Check if password expiring soon (within 7 days)
            const user = await Database.get<any>('SELECT password_expires_at FROM users WHERE id = ?', [userData.userId]);
            const passwordExpiryWarning = user.password_expires_at
                ? Math.ceil((new Date(user.password_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

            const response: any = {
                message: 'Login successful',
                user: {
                    id: userData.userId,
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.role,
                    companyName: userData.companyName
                },
                accessToken,
                refreshToken
            };

            // Add password expiry warning if applicable
            if (passwordExpiryWarning !== null && passwordExpiryWarning <= 7 && passwordExpiryWarning > 0) {
                response.passwordExpiringIn = passwordExpiryWarning;
                response.warning = `Your password will expire in ${passwordExpiryWarning} day(s)`;
            }

            res.json(response);
        } catch (error) {
            console.error('Verify login OTP error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Resend OTP
     */
    static async resendOTP(req: Request, res: Response): Promise<void> {
        try {
            const { tempToken } = req.body;

            if (!tempToken) {
                res.status(400).json({ error: 'Temporary token required' });
                return;
            }

            // Get OTP data
            const otpData = OTPUtil.getOTPData(tempToken);

            if (!otpData) {
                res.status(400).json({ error: 'Invalid or expired token' });
                return;
            }

            // Regenerate OTP
            const newOTP = OTPUtil.regenerateOTP(tempToken);

            if (!newOTP) {
                res.status(400).json({ error: 'Failed to regenerate OTP' });
                return;
            }

            // Send new OTP email
            const userName = otpData.purpose === 'signup'
                ? otpData.data?.fullName
                : otpData.data?.fullName;

            await EmailService.sendOTPEmail(otpData.email, newOTP, otpData.purpose, userName);

            res.status(200).json({
                message: 'OTP resent successfully',
                expiresIn: 300 // 5 minutes
            });
        } catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
