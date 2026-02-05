/**
 * Security Demonstrations Controller
 */

import { Request, Response } from 'express';
import { Base64Util } from '../utils/security/base64.util';
import { XORUtil } from '../utils/security/xor.util';
import { HashUtil } from '../utils/security/hash.util';
import { SignatureUtil } from '../utils/security/signature.util';
import { PasswordUtil } from '../utils/security/password.util';
import { Database } from '../database/database';

export class SecurityController {
    /**
     * Base64 Encode
     */
    static async base64Encode(req: Request, res: Response): Promise<void> {
        try {
            const { data } = req.body;

            if (!data) {
                res.status(400).json({ error: 'Data required' });
                return;
            }

            const encoded = Base64Util.encode(data);

            // Log demo
            if (req.user) {
                await Database.run(
                    'INSERT INTO security_demos (user_id, demo_type, input_data, output_data) VALUES (?, ?, ?, ?)',
                    [req.user.userId, 'base64', data, encoded]
                );
            }

            res.json({
                input: data,
                encoded,
                length: {
                    original: data.length,
                    encoded: encoded.length
                }
            });
        } catch (error) {
            console.error('Base64 encode error:', error);
            res.status(500).json({ error: 'Encoding failed' });
        }
    }

    /**
     * Base64 Decode
     */
    static async base64Decode(req: Request, res: Response): Promise<void> {
        try {
            const { data } = req.body;

            if (!data) {
                res.status(400).json({ error: 'Data required' });
                return;
            }

            if (!Base64Util.isBase64(data)) {
                res.status(400).json({ error: 'Invalid Base64 string' });
                return;
            }

            const decoded = Base64Util.decode(data);

            res.json({
                encoded: data,
                decoded,
                length: {
                    encoded: data.length,
                    decoded: decoded.length
                }
            });
        } catch (error) {
            console.error('Base64 decode error:', error);
            res.status(500).json({ error: 'Decoding failed' });
        }
    }

    /**
     * XOR Encrypt
     */
    static async xorEncrypt(req: Request, res: Response): Promise<void> {
        try {
            const { data, key } = req.body;

            if (!data) {
                res.status(400).json({ error: 'Data required' });
                return;
            }

            // Generate key if not provided
            const encryptionKey = key || XORUtil.generateKey();

            if (key && !XORUtil.isValidKey(key)) {
                res.status(400).json({ error: 'Invalid key format (must be hex, min 16 chars)' });
                return;
            }

            const encrypted = XORUtil.encrypt(data, encryptionKey);
            const demonstration = XORUtil.demonstrateXOR(data, encryptionKey);

            // Log demo
            if (req.user) {
                await Database.run(
                    'INSERT INTO security_demos (user_id, demo_type, input_data, output_data) VALUES (?, ?, ?, ?)',
                    [req.user.userId, 'xor', data, encrypted]
                );
            }

            res.json({
                input: data,
                encrypted,
                key: encryptionKey,
                demonstration: demonstration,
                note: 'Store the key securely! You need it to decrypt the data.'
            });
        } catch (error) {
            console.error('XOR encrypt error:', error);
            res.status(500).json({ error: 'Encryption failed' });
        }
    }

    /**
     * XOR Decrypt
     */
    static async xorDecrypt(req: Request, res: Response): Promise<void> {
        try {
            const { data, key } = req.body;

            if (!data || !key) {
                res.status(400).json({ error: 'Data and key required' });
                return;
            }

            if (!XORUtil.isValidKey(key)) {
                res.status(400).json({ error: 'Invalid key format' });
                return;
            }

            const decrypted = XORUtil.decrypt(data, key);

            res.json({
                encrypted: data,
                decrypted,
                key: key
            });
        } catch (error) {
            console.error('XOR decrypt error:', error);
            res.status(500).json({ error: 'Decryption failed' });
        }
    }

    /**
     * Generate Hash
     */
    static async generateHash(req: Request, res: Response): Promise<void> {
        try {
            const { data, algorithm } = req.body;

            if (!data) {
                res.status(400).json({ error: 'Data required' });
                return;
            }

            const demonstration = HashUtil.demonstrateHashing(data);
            let hash: string;

            switch (algorithm) {
                case 'md5':
                    hash = HashUtil.md5(data);
                    break;
                case 'sha512':
                    hash = HashUtil.sha512(data);
                    break;
                case 'sha256':
                default:
                    hash = HashUtil.sha256(data);
            }

            // Log demo
            if (req.user) {
                await Database.run(
                    'INSERT INTO security_demos (user_id, demo_type, input_data, output_data) VALUES (?, ?, ?, ?)',
                    [req.user.userId, 'hash', data, hash]
                );
            }

            res.json({
                input: data,
                hash,
                algorithm: algorithm || 'sha256',
                demonstration,
                note: 'Hashing is one-way - you cannot reverse it to get the original data'
            });
        } catch (error) {
            console.error('Hash generation error:', error);
            res.status(500).json({ error: 'Hash generation failed' });
        }
    }

    /**
     * Verify Hash
     */
    static async verifyHash(req: Request, res: Response): Promise<void> {
        try {
            const { data, hash, algorithm } = req.body;

            if (!data || !hash) {
                res.status(400).json({ error: 'Data and hash required' });
                return;
            }

            let computedHash: string;

            switch (algorithm) {
                case 'md5':
                    computedHash = HashUtil.md5(data);
                    break;
                case 'sha512':
                    computedHash = HashUtil.sha512(data);
                    break;
                case 'sha256':
                default:
                    computedHash = HashUtil.sha256(data);
            }

            const isMatch = HashUtil.timingSafeCompare(computedHash, hash);

            res.json({
                input: data,
                providedHash: hash,
                computedHash,
                isMatch,
                algorithm: algorithm || 'sha256'
            });
        } catch (error) {
            console.error('Hash verification error:', error);
            res.status(500).json({ error: 'Hash verification failed' });
        }
    }

    /**
     * Create Digital Signature
     */
    static async createSignature(req: Request, res: Response): Promise<void> {
        try {
            const { data } = req.body;

            if (!data) {
                res.status(400).json({ error: 'Data required' });
                return;
            }

            // Generate key pair
            const { publicKey, privateKey } = SignatureUtil.generateKeyPair();

            // Sign the data
            const signature = SignatureUtil.sign(data, privateKey);

            // Create demonstration
            const demonstration = SignatureUtil.demonstrateSignature(data);

            // Log demo
            if (req.user) {
                await Database.run(
                    'INSERT INTO security_demos (user_id, demo_type, input_data, output_data) VALUES (?, ?, ?, ?)',
                    [req.user.userId, 'signature', data, signature]
                );
            }

            res.json({
                data,
                signature,
                publicKey,
                privateKey: '*** (Keep this secret! Only showing for demo purposes) ***',
                demonstration,
                note: 'In production, store the private key securely and never expose it!'
            });
        } catch (error) {
            console.error('Signature creation error:', error);
            res.status(500).json({ error: 'Signature creation failed' });
        }
    }

    /**
     * Verify Digital Signature
     */
    static async verifySignature(req: Request, res: Response): Promise<void> {
        try {
            const { data, signature, publicKey } = req.body;

            if (!data || !signature || !publicKey) {
                res.status(400).json({ error: 'Data, signature, and public key required' });
                return;
            }

            const isValid = SignatureUtil.verify(data, signature, publicKey);

            res.json({
                data,
                signature,
                publicKey: publicKey.substring(0, 100) + '...',
                isValid,
                message: isValid
                    ? 'Signature is valid - data has not been tampered with'
                    : 'Signature is invalid - data may have been modified'
            });
        } catch (error) {
            console.error('Signature verification error:', error);
            res.status(500).json({ error: 'Signature verification failed' });
        }
    }

    /**
     * Analyze Password
     */
    static async analyzePassword(req: Request, res: Response): Promise<void> {
        try {
            const { password } = req.body;

            if (!password) {
                res.status(400).json({ error: 'Password required' });
                return;
            }

            const analysis = PasswordUtil.analyzeStrength(password);
            const recommendations = PasswordUtil.getPasswordRecommendations();

            // Log demo
            if (req.user) {
                await Database.run(
                    'INSERT INTO security_demos (user_id, demo_type, input_data, output_data) VALUES (?, ?, ?, ?)',
                    [req.user.userId, 'password', '***', JSON.stringify(analysis)]
                );
            }

            res.json({
                password: '***', // Don't expose the actual password
                analysis,
                recommendations
            });
        } catch (error) {
            console.error('Password analysis error:', error);
            res.status(500).json({ error: 'Password analysis failed' });
        }
    }

    /**
     * Simulate Password Cracking
     */
    static async crackPassword(req: Request, res: Response): Promise<void> {
        try {
            const { password, method } = req.body;

            if (!password) {
                res.status(400).json({ error: 'Password required' });
                return;
            }

            // Hash the password
            const passwordHash = HashUtil.sha256(password);

            let result: any;

            if (method === 'bruteforce') {
                // Brute force (limited for demo)
                result = await PasswordUtil.simulateBruteForce(passwordHash, 4);
            } else {
                // Dictionary attack (default)
                result = await PasswordUtil.simulateDictionaryAttack(passwordHash);
            }

            res.json({
                method: method || 'dictionary',
                targetHash: passwordHash,
                success: result.success,
                crackedPassword: result.password || null,
                attempts: result.attempts,
                timeTaken: `${result.timeTaken}ms`,
                message: result.success
                    ? `⚠️  Password cracked! Found: "${result.password}" in ${result.attempts} attempts`
                    : `✓ Password not found in ${result.attempts} attempts. Use stronger passwords!`
            });
        } catch (error) {
            console.error('Password cracking error:', error);
            res.status(500).json({ error: 'Password cracking simulation failed' });
        }
    }

    /**
     * Generate Secure Password
     */
    static async generatePassword(req: Request, res: Response): Promise<void> {
        try {
            const { length, includeSymbols } = req.body;

            const password = PasswordUtil.generateSecurePassword(
                length || 16,
                includeSymbols !== false
            );

            const analysis = PasswordUtil.analyzeStrength(password);

            res.json({
                password,
                length: password.length,
                analysis
            });
        } catch (error) {
            console.error('Password generation error:', error);
            res.status(500).json({ error: 'Password generation failed' });
        }
    }
}
