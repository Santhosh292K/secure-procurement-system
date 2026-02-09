/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// OTP-based authentication routes (recommended)
router.post('/signup/initiate', AuthController.initiateSignup);
router.post('/signup/verify', AuthController.verifySignupOTP);
router.post('/login/initiate', AuthController.initiateLogin);
router.post('/login/verify', AuthController.verifyLoginOTP);
router.post('/otp/resend', AuthController.resendOTP);

// Legacy routes (deprecated, kept for backward compatibility)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
