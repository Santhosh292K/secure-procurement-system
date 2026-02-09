/**
 * Password History Utility
 * Manages password history to prevent reuse and enforce password expiration
 */

import { Database } from '../../database/database';
import { HashUtil } from './hash.util';

export class PasswordHistoryUtil {
    private static readonly PASSWORD_HISTORY_LIMIT = 5; // Remember last 5 passwords
    private static readonly PASSWORD_EXPIRY_DAYS = 90; // Password expires after 90 days

    /**
     * Check if password was used before
     * @param userId - User ID
     * @param newPassword - New password to check
     * @returns True if password was used before
     */
    static async isPasswordReused(userId: number, newPassword: string): Promise<boolean> {
        const history = await Database.all<{ password_hash: string }>(
            `SELECT password_hash FROM password_history 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, this.PASSWORD_HISTORY_LIMIT]
        );

        // Check against current password too
        const currentUser = await Database.get<{ password_hash: string }>(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (currentUser) {
            const isCurrentPassword = await HashUtil.verifyPassword(newPassword, currentUser.password_hash);
            if (isCurrentPassword) {
                return true;
            }
        }

        // Check against password history
        for (const entry of history) {
            const matches = await HashUtil.verifyPassword(newPassword, entry.password_hash);
            if (matches) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add password to history
     * @param userId - User ID
     * @param passwordHash - Hash of the old password
     */
    static async addToHistory(userId: number, passwordHash: string): Promise<void> {
        await Database.run(
            'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
            [userId, passwordHash]
        );

        // Keep only the last N passwords
        await this.cleanupOldHistory(userId);
    }

    /**
     * Clean up old password history entries
     * @param userId - User ID
     */
    private static async cleanupOldHistory(userId: number): Promise<void> {
        const history = await Database.all<{ id: number }>(
            `SELECT id FROM password_history 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT -1 OFFSET ?`,
            [userId, this.PASSWORD_HISTORY_LIMIT]
        );

        for (const entry of history) {
            await Database.run('DELETE FROM password_history WHERE id = ?', [entry.id]);
        }
    }

    /**
     * Calculate password expiration date
     * @returns Expiration date
     */
    static calculateExpirationDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.PASSWORD_EXPIRY_DAYS);
        return expiryDate;
    }

    /**
     * Check if password has expired
     * @param expiresAt - Password expiration date
     * @returns True if expired
     */
    static isPasswordExpired(expiresAt: string | null): boolean {
        if (!expiresAt) {
            return false;
        }
        return new Date(expiresAt) < new Date();
    }

    /**
     * Get days until password expires
     * @param expiresAt - Password expiration date
     * @returns Days remaining, or null if not expiring
     */
    static getDaysUntilExpiry(expiresAt: string | null): number | null {
        if (!expiresAt) {
            return null;
        }

        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    }
}
