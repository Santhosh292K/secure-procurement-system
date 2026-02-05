/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
