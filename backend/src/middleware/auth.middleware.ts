/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { JWTUtil, TokenPayload } from '../utils/jwt.util';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Authenticate JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const payload = JWTUtil.verifyAccessToken(token);

        req.user = payload;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Authorize specific roles
 */
export function authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = JWTUtil.verifyAccessToken(token);
            req.user = payload;
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
}
