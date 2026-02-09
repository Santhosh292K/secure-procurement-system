/**
 * TOTP (Time-based One-Time Password) Utility
 * For Two-Factor Authentication
 */

import crypto from 'crypto';

export class TOTPUtil {
    private static readonly TOTP_WINDOW = 30; // 30-second window
    private static readonly TOTP_DIGITS = 6; // 6-digit codes
    private static readonly BACKUP_CODES_COUNT = 10; // Number of backup codes

    /**
     * Generate a secret key for TOTP
     * @returns Base32 encoded secret
     */
    static generateSecret(): string {
        const buffer = crypto.randomBytes(20);
        return this.base32Encode(buffer);
    }

    /**
     * Generate TOTP token
     * @param secret - Base32 encoded secret
     * @param time - Optional time (defaults to current time)
     * @returns 6-digit TOTP code
     */
    static generateToken(secret: string, time?: number): string {
        const epoch = Math.floor((time || Date.now()) / 1000);
        const counter = Math.floor(epoch / this.TOTP_WINDOW);

        const secretBuffer = this.base32Decode(secret);
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigInt64BE(BigInt(counter));

        const hmac = crypto.createHmac('sha1', secretBuffer);
        hmac.update(counterBuffer);
        const hash = hmac.digest();

        const offset = hash[hash.length - 1] & 0xf;
        const binary =
            ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);

        const otp = binary % Math.pow(10, this.TOTP_DIGITS);
        return otp.toString().padStart(this.TOTP_DIGITS, '0');
    }

    /**
     * Verify TOTP token
     * @param token - Token to verify
     * @param secret - Base32 encoded secret
     * @param window - Time window tolerance (default 1 = ±30 seconds)
     * @returns True if token is valid
     */
    static verifyToken(token: string, secret: string, window: number = 1): boolean {
        const now = Date.now();

        for (let i = -window; i <= window; i++) {
            const testTime = now + i * this.TOTP_WINDOW * 1000;
            const expectedToken = this.generateToken(secret, testTime);

            if (token === expectedToken) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate QR code URL for authenticator apps
     * @param secret - Base32 encoded secret
     * @param accountName - User's email or account name
     * @param issuer - App/company name
     * @returns OTPAuth URL
     */
    static generateQRCodeURL(secret: string, accountName: string, issuer: string = 'SecureProcurement'): string {
        const params = new URLSearchParams({
            secret,
            issuer,
            algorithm: 'SHA1',
            digits: this.TOTP_DIGITS.toString(),
            period: this.TOTP_WINDOW.toString(),
        });

        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
    }

    /**
     * Generate backup codes
     * @returns Array of backup codes
     */
    static generateBackupCodes(): string[] {
        const codes: string[] = [];

        for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            // Format as XXXX-XXXX
            const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
            codes.push(formatted);
        }

        return codes;
    }

    /**
     * Hash backup code for storage
     * @param code - Backup code
     * @returns Hashed code
     */
    static hashBackupCode(code: string): string {
        return crypto.createHash('sha256').update(code).digest('hex');
    }

    /**
     * Verify backup code
     * @param code - Code to verify
     * @param hashedCodes - Array of hashed backup codes
     * @returns True if valid
     */
    static verifyBackupCode(code: string, hashedCodes: string[]): boolean {
        const hashedInput = this.hashBackupCode(code);
        return hashedCodes.includes(hashedInput);
    }

    /**
     * Base32 encode
     * @param buffer - Buffer to encode
     * @returns Base32 string
     */
    private static base32Encode(buffer: Buffer): string {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;

            while (bits >= 5) {
                output += base32Chars[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += base32Chars[(value << (5 - bits)) & 31];
        }

        return output;
    }

    /**
     * Base32 decode
     * @param str - Base32 string
     * @returns Decoded buffer
     */
    private static base32Decode(str: string): Buffer {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let index = 0;
        const output = Buffer.alloc(((str.length * 5) / 8) | 0);

        for (let i = 0; i < str.length; i++) {
            const idx = base32Chars.indexOf(str[i].toUpperCase());
            if (idx === -1) continue;

            value = (value << 5) | idx;
            bits += 5;

            if (bits >= 8) {
                output[index++] = (value >>> (bits - 8)) & 255;
                bits -= 8;
            }
        }

        return output.slice(0, index);
    }
}
