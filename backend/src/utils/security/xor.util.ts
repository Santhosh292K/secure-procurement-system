/**
 * XOR Encryption/Decryption Utility
 * Demonstrates symmetric encryption using XOR cipher
 * Note: XOR is educational - use AES for production
 */

import crypto from 'crypto';

export class XORUtil {
    /**
     * Generate a random encryption key
     * @param length - Key length in bytes (default: 32)
     * @returns Hex-encoded key
     */
    static generateKey(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * XOR encrypt data with key
     * @param data - Data to encrypt
     * @param key - Encryption key (hex string)
     * @returns Encrypted data as hex string
     */
    static encrypt(data: string, key: string): string {
        const dataBuffer = Buffer.from(data, 'utf-8');
        const keyBuffer = Buffer.from(key, 'hex');

        const encrypted = Buffer.alloc(dataBuffer.length);

        for (let i = 0; i < dataBuffer.length; i++) {
            // XOR each byte with corresponding key byte (cycling through key)
            encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return encrypted.toString('hex');
    }

    /**
     * XOR decrypt data with key
     * XOR is symmetric, so decrypt is same as encrypt
     * @param encryptedData - Encrypted data as hex string
     * @param key - Encryption key (hex string)
     * @returns Decrypted string
     */
    static decrypt(encryptedData: string, key: string): string {
        const encryptedBuffer = Buffer.from(encryptedData, 'hex');
        const keyBuffer = Buffer.from(key, 'hex');

        const decrypted = Buffer.alloc(encryptedBuffer.length);

        for (let i = 0; i < encryptedBuffer.length; i++) {
            // XOR each byte with corresponding key byte (cycling through key)
            decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return decrypted.toString('utf-8');
    }

    /**
     * Encrypt JSON object
     * @param obj - Object to encrypt
     * @param key - Encryption key
     * @returns Encrypted hex string
     */
    static encryptJSON(obj: any, key: string): string {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString, key);
    }

    /**
     * Decrypt to JSON object
     * @param encryptedData - Encrypted hex string
     * @param key - Encryption key
     * @returns Decrypted object
     */
    static decryptJSON<T = any>(encryptedData: string, key: string): T {
        const jsonString = this.decrypt(encryptedData, key);
        return JSON.parse(jsonString) as T;
    }

    /**
     * Demonstrate XOR with visual representation
     * @param data - Data to encrypt
     * @param key - Key to use
     * @returns Object with encryption steps
     */
    static demonstrateXOR(data: string, key: string): {
        original: string;
        originalBinary: string[];
        keyBinary: string[];
        xorResult: string[];
        encrypted: string;
    } {
        const dataBuffer = Buffer.from(data, 'utf-8');
        const keyBuffer = Buffer.from(key, 'hex');

        const originalBinary: string[] = [];
        const keyBinary: string[] = [];
        const xorResult: string[] = [];

        for (let i = 0; i < Math.min(dataBuffer.length, 10); i++) {
            const dataByte = dataBuffer[i];
            const keyByte = keyBuffer[i % keyBuffer.length];
            const xorByte = dataByte ^ keyByte;

            originalBinary.push(dataByte.toString(2).padStart(8, '0'));
            keyBinary.push(keyByte.toString(2).padStart(8, '0'));
            xorResult.push(xorByte.toString(2).padStart(8, '0'));
        }

        return {
            original: data,
            originalBinary,
            keyBinary,
            xorResult,
            encrypted: this.encrypt(data, key)
        };
    }

    /**
     * Validate encryption key format
     * @param key - Key to validate
     * @returns True if valid hex string
     */
    static isValidKey(key: string): boolean {
        return /^[0-9a-fA-F]+$/.test(key) && key.length >= 16;
    }
}
