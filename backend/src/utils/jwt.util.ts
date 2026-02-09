/**
 * JWT Token Utility
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
    userId: number;
    email: string;
    role: 'admin' | 'vendor' | 'approver';
}

export class JWTUtil {
    /**
     * Generate access token
     */
    static generateAccessToken(payload: TokenPayload, expiresIn?: string): string {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: expiresIn || JWT_EXPIRES_IN
        } as jwt.SignOptions);
    }

    /**
     * Generate refresh token
     */
    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        } as jwt.SignOptions);
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): any {
        return jwt.decode(token);
    }
}
