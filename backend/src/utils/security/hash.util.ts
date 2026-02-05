/**
 * Hashing Utilities
 * Demonstrates various hashing algorithms for data integrity and password security
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class HashUtil {
    private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

    /**
     * Generate SHA-256 hash
     * @param data - Data to hash
     * @returns Hex-encoded hash
     */
    static sha256(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate SHA-512 hash
     * @param data - Data to hash
     * @returns Hex-encoded hash
     */
    static sha512(data: string): string {
        return crypto.createHash('sha512').update(data).digest('hex');
    }

    /**
     * Generate MD5 hash (legacy, not recommended for security)
     * @param data - Data to hash
     * @returns Hex-encoded hash
     */
    static md5(data: string): string {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Generate HMAC (Hash-based Message Authentication Code)
     * @param data - Data to hash
     * @param secret - Secret key
     * @param algorithm - Hash algorithm (default: sha256)
     * @returns Hex-encoded HMAC
     */
    static hmac(data: string, secret: string, algorithm: string = 'sha256'): string {
        return crypto.createHmac(algorithm, secret).update(data).digest('hex');
    }

    /**
     * Verify HMAC
     * @param data - Original data
     * @param hmac - HMAC to verify
     * @param secret - Secret key
     * @param algorithm - Hash algorithm
     * @returns True if HMAC is valid
     */
    static verifyHMAC(data: string, hmac: string, secret: string, algorithm: string = 'sha256'): boolean {
        const expectedHmac = this.hmac(data, secret, algorithm);
        return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
    }

    /**
     * Hash password using bcrypt (slow, secure for passwords)
     * @param password - Password to hash
     * @returns Hashed password
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.BCRYPT_ROUNDS);
    }

    /**
     * Verify password against bcrypt hash
     * @param password - Plain password
     * @param hash - Bcrypt hash
     * @returns True if password matches
     */
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate salt for hashing
     * @param rounds - Number of rounds (default: 10)
     * @returns Salt string
     */
    static async generateSalt(rounds: number = this.BCRYPT_ROUNDS): Promise<string> {
        return bcrypt.genSalt(rounds);
    }

    /**
     * Hash file contents
     * @param buffer - File buffer
     * @param algorithm - Hash algorithm
     * @returns File hash
     */
    static hashFile(buffer: Buffer, algorithm: string = 'sha256'): string {
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }

    /**
     * Generate hash with salt
     * @param data - Data to hash
     * @param salt - Salt to use
     * @returns Salted hash
     */
    static hashWithSalt(data: string, salt: string): string {
        return this.sha256(data + salt);
    }

    /**
     * Demonstrate different hash algorithms
     * @param data - Data to hash
     * @returns Object with various hash outputs
     */
    static demonstrateHashing(data: string): {
        input: string;
        md5: string;
        sha1: string;
        sha256: string;
        sha512: string;
        inputLength: number;
        md5Length: number;
        sha256Length: number;
        sha512Length: number;
    } {
        const sha1 = crypto.createHash('sha1').update(data).digest('hex');

        return {
            input: data,
            md5: this.md5(data),
            sha1,
            sha256: this.sha256(data),
            sha512: this.sha512(data),
            inputLength: data.length,
            md5Length: this.md5(data).length,
            sha256Length: this.sha256(data).length,
            sha512Length: this.sha512(data).length
        };
    }

    /**
     * Check if two hashes match (timing-safe comparison)
     * @param hash1 - First hash
     * @param hash2 - Second hash
     * @returns True if hashes match
     */
    static timingSafeCompare(hash1: string, hash2: string): boolean {
        if (hash1.length !== hash2.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
    }

    /**
     * Generate random hash (useful for tokens)
     * @param length - Byte length (default: 32)
     * @returns Random hex string
     */
    static randomHash(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}
