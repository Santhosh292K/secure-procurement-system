/**
 * Digital Signature Utility
 * Demonstrates RSA digital signatures for authentication and non-repudiation
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class SignatureUtil {
    private static keyPair: { publicKey: string; privateKey: string } | null = null;

    /**
     * Generate RSA key pair
     * @param modulusLength - Key size in bits (default: 2048)
     * @returns Object with public and private keys
     */
    static generateKeyPair(modulusLength: number = 2048): {
        publicKey: string;
        privateKey: string;
    } {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        this.keyPair = { publicKey, privateKey };
        return { publicKey, privateKey };
    }

    /**
     * Save key pair to files
     * @param publicKeyPath - Path to save public key
     * @param privateKeyPath - Path to save private key
     */
    static saveKeyPair(publicKeyPath: string, privateKeyPath: string): void {
        if (!this.keyPair) {
            this.generateKeyPair();
        }

        const dir = path.dirname(publicKeyPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(publicKeyPath, this.keyPair!.publicKey);
        fs.writeFileSync(privateKeyPath, this.keyPair!.privateKey);
    }

    /**
     * Load key pair from files
     * @param publicKeyPath - Path to public key file
     * @param privateKeyPath - Path to private key file
     */
    static loadKeyPair(publicKeyPath: string, privateKeyPath: string): void {
        const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
        this.keyPair = { publicKey, privateKey };
    }

    /**
     * Sign data with private key
     * @param data - Data to sign
     * @param privateKey - Private key (optional, uses stored key if not provided)
     * @returns Signature as hex string
     */
    static sign(data: string, privateKey?: string): string {
        const key = privateKey || this.keyPair?.privateKey;

        if (!key) {
            throw new Error('Private key not available. Generate or load a key pair first.');
        }

        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        sign.end();

        return sign.sign(key, 'hex');
    }

    /**
     * Verify signature with public key
     * @param data - Original data
     * @param signature - Signature to verify
     * @param publicKey - Public key (optional, uses stored key if not provided)
     * @returns True if signature is valid
     */
    static verify(data: string, signature: string, publicKey?: string): boolean {
        const key = publicKey || this.keyPair?.publicKey;

        if (!key) {
            throw new Error('Public key not available. Generate or load a key pair first.');
        }

        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        verify.end();

        try {
            return verify.verify(key, signature, 'hex');
        } catch (error) {
            return false;
        }
    }

    /**
     * Sign JSON object
     * @param obj - Object to sign
     * @param privateKey - Private key
     * @returns Signature
     */
    static signJSON(obj: any, privateKey?: string): string {
        const jsonString = JSON.stringify(obj);
        return this.sign(jsonString, privateKey);
    }

    /**
     * Verify JSON object signature
     * @param obj - Object to verify
     * @param signature - Signature
     * @param publicKey - Public key
     * @returns True if valid
     */
    static verifyJSON(obj: any, signature: string, publicKey?: string): boolean {
        const jsonString = JSON.stringify(obj);
        return this.verify(jsonString, signature, publicKey);
    }

    /**
     * Create signed document (data + signature)
     * @param data - Data to sign
     * @param privateKey - Private key
     * @returns Object with data and signature
     */
    static createSignedDocument(data: string, privateKey?: string): {
        data: string;
        signature: string;
        timestamp: string;
    } {
        const timestamp = new Date().toISOString();
        const dataWithTimestamp = data + timestamp;
        const signature = this.sign(dataWithTimestamp, privateKey);

        return {
            data,
            signature,
            timestamp
        };
    }

    /**
     * Verify signed document
     * @param document - Signed document
     * @param publicKey - Public key
     * @returns True if valid
     */
    static verifySignedDocument(
        document: { data: string; signature: string; timestamp: string },
        publicKey?: string
    ): boolean {
        const dataWithTimestamp = document.data + document.timestamp;
        return this.verify(dataWithTimestamp, document.signature, publicKey);
    }

    /**
     * Get current public key
     * @returns Public key or null
     */
    static getPublicKey(): string | null {
        return this.keyPair?.publicKey || null;
    }

    /**
     * Demonstrate signature process
     * @param data - Data to demonstrate with
     * @returns Demonstration object
     */
    static demonstrateSignature(data: string): {
        originalData: string;
        publicKey: string;
        signature: string;
        isValid: boolean;
        tamperedData: string;
        tamperedValid: boolean;
    } {
        // Generate new key pair for demo
        const { publicKey, privateKey } = this.generateKeyPair();

        // Sign original data
        const signature = this.sign(data, privateKey);

        // Verify original
        const isValid = this.verify(data, signature, publicKey);

        // Tamper with data
        const tamperedData = data + ' (modified)';
        const tamperedValid = this.verify(tamperedData, signature, publicKey);

        return {
            originalData: data,
            publicKey: publicKey.substring(0, 100) + '...',
            signature: signature.substring(0, 50) + '...',
            isValid,
            tamperedData,
            tamperedValid
        };
    }

    /**
     * Generate ECDSA key pair (alternative to RSA)
     * @returns Object with public and private keys
     */
    static generateECDSAKeyPair(): {
        publicKey: string;
        privateKey: string;
    } {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return { publicKey, privateKey };
    }
}
