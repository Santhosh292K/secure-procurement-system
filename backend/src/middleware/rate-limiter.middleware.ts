/**
 * Advanced Rate Limiting Middleware
 * Implements endpoint-specific rate limiting, progressive delays, and IP blocking
 */

import { Request, Response, NextFunction } from 'express';
import { Database } from '../database/database';

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message?: string;
}

class RateLimiterStore {
    private requests: Map<string, { count: number; resetTime: number; failedAttempts: number }> = new Map();

    /**
     * Record a request
     * @param key - Identifier key (IP + endpoint)
     * @param windowMs - Time window in milliseconds
     * @returns Current count
     */
    record(key: string, windowMs: number): number {
        const now = Date.now();
        const record = this.requests.get(key);

        if (!record || now > record.resetTime) {
            this.requests.set(key, {
                count: 1,
                resetTime: now + windowMs,
                failedAttempts: 0,
            });
            return 1;
        }

        record.count++;
        return record.count;
    }

    /**
     * Record a failed attempt
     * @param key - Identifier key
     */
    recordFailure(key: string): void {
        const record = this.requests.get(key);
        if (record) {
            record.failedAttempts++;
        }
    }

    /**
     * Get failed attempts count
     * @param key - Identifier key
     * @returns Number of failed attempts
     */
    getFailedAttempts(key: string): number {
        const record = this.requests.get(key);
        return record?.failedAttempts || 0;
    }

    /**
     * Reset counter for key
     * @param key - Identifier key
     */
    reset(key: string): void {
        this.requests.delete(key);
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}

const store = new RateLimiterStore();

// Cleanup every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

/**
 * Create rate limiter middleware
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';

            // Check if IP is blocked
            const isBlocked = await isIPBlocked(ip);
            if (isBlocked) {
                res.status(403).json({ error: 'Your IP address has been blocked due to suspicious activity' });
                return;
            }

            const key = `${ip}:${req.path}`;
            const count = store.record(key, config.windowMs);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count));
            res.setHeader('X-RateLimit-Reset', Date.now() + config.windowMs);

            if (count > config.maxRequests) {
                // Log security event
                await logSecurityEvent({
                    eventType: 'brute_force_attempt',
                    severity: 'high',
                    ipAddress: ip,
                    userAgent: req.headers['user-agent'],
                    details: `Rate limit exceeded: ${count} requests to ${req.path}`,
                });

                // Progressive blocking: block IP if too many violations
                const failures = store.getFailedAttempts(key);
                if (failures > 10) {
                    await blockIP(ip, 'Repeated rate limit violations', 24); // Block for 24 hours
                }

                store.recordFailure(key);

                res.status(429).json({
                    error: config.message || 'Too many requests, please try again later',
                    retryAfter: Math.ceil(config.windowMs / 1000),
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Rate limiter error:', error);
            next();
        }
    };
}

/**
 * Progressive delay middleware for failed attempts
 * Adds increasing delays after repeated failures
 */
export function progressiveDelay() {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `${ip}:${req.path}`;
        const failures = store.getFailedAttempts(key);

        if (failures > 0) {
            // Exponential backoff: 1s, 2s, 4s, 8s, etc.
            const delayMs = Math.min(Math.pow(2, failures) * 1000, 30000); // Max 30 seconds
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        next();
    };
}

/**
 * Check if IP is blocked
 * @param ip - IP address
 * @returns True if blocked
 */
async function isIPBlocked(ip: string): Promise<boolean> {
    try {
        const blocked = await Database.get<{ id: number; expires_at: string | null; is_permanent: number }>(
            `SELECT id, expires_at, is_permanent FROM blocked_ips 
             WHERE ip_address = ? 
             AND (is_permanent = 1 OR expires_at > datetime('now'))`,
            [ip]
        );

        return !!blocked;
    } catch (error) {
        console.error('Error checking blocked IP:', error);
        return false;
    }
}

/**
 * Block an IP address
 * @param ip - IP address
 * @param reason - Reason for blocking
 * @param hours - Hours to block (0 = permanent)
 */
async function blockIP(ip: string, reason: string, hours: number = 0): Promise<void> {
    try {
        const expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
        const isPermanent = hours === 0 ? 1 : 0;

        await Database.run(
            `INSERT OR REPLACE INTO blocked_ips (ip_address, reason, expires_at, is_permanent)
             VALUES (?, ?, ?, ?)`,
            [ip, reason, expiresAt, isPermanent]
        );

        console.log(`🚫 Blocked IP: ${ip} - Reason: ${reason}`);
    } catch (error) {
        console.error('Error blocking IP:', error);
    }
}

/**
 * Log security event
 * @param event - Security event details
 */
async function logSecurityEvent(event: {
    userId?: number;
    eventType: string;
    severity: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
}): Promise<void> {
    try {
        await Database.run(
            `INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [event.userId || null, event.eventType, event.severity, event.ipAddress || null, event.userAgent || null, event.details || null]
        );
    } catch (error) {
        console.error('Error logging security event:', error);
    }
}

/**
 * Predefined rate limiters for common endpoints
 */
export const RateLimiters = {
    auth: {
        login: createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 5,
            message: 'Too many login attempts, please try again in 15 minutes',
        }),
        register: createRateLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 3,
            message: 'Too many registration attempts, please try again later',
        }),
        passwordReset: createRateLimiter({
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 3,
            message: 'Too many password reset attempts, please try again later',
        }),
    },
    api: {
        general: createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 100,
        }),
        strict: createRateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 20,
        }),
    },
};
