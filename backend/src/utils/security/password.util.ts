/**
 * Password Security Utility
 * Demonstrates password strength analysis, common password checking, and cracking simulation
 */

import { HashUtil } from './hash.util';

export class PasswordUtil {
    // Common weak passwords (subset for demonstration)
    private static readonly COMMON_PASSWORDS = [
        'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
        'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
        'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
        'qazwsx', 'michael', 'football', 'password1', 'admin', 'welcome', 'login'
    ];

    /**
     * Analyze password strength
     * @param password - Password to analyze
     * @returns Strength analysis object
     */
    static analyzeStrength(password: string): {
        score: number;
        strength: 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
        feedback: string[];
        estimatedCrackTime: string;
        entropy: number;
    } {
        let score = 0;
        const feedback: string[] = [];

        // Length check
        if (password.length < 8) {
            feedback.push('Password should be at least 8 characters long');
        } else if (password.length >= 8 && password.length < 12) {
            score += 1;
            feedback.push('Consider using 12+ characters for better security');
        } else if (password.length >= 12 && password.length < 16) {
            score += 2;
        } else {
            score += 3;
        }

        // Character variety checks
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add lowercase letters');
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add uppercase letters');
        }

        if (/[0-9]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add numbers');
        }

        if (/[^a-zA-Z0-9]/.test(password)) {
            score += 2;
        } else {
            feedback.push('Add special characters (!@#$%^&*)');
        }

        // Common password check
        if (this.isCommonPassword(password)) {
            score = Math.max(0, score - 3);
            feedback.push('⚠️  This is a commonly used password');
        }

        // Pattern detection
        if (/^(.*?)\1+$/.test(password)) {
            score = Math.max(0, score - 2);
            feedback.push('Avoid repeating patterns');
        }

        if (/^[0-9]+$/.test(password)) {
            score = Math.max(0, score - 2);
            feedback.push('Avoid using only numbers');
        }

        if (/^[a-zA-Z]+$/.test(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Mix letters with numbers and symbols');
        }

        // Sequential characters
        if (this.hasSequentialChars(password)) {
            score = Math.max(0, score - 1);
            feedback.push('Avoid sequential characters (abc, 123)');
        }

        // Calculate entropy
        const entropy = this.calculateEntropy(password);

        // Determine strength
        let strength: 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
        if (score <= 2) {
            strength = 'very weak';
        } else if (score <= 4) {
            strength = 'weak';
        } else if (score <= 6) {
            strength = 'medium';
        } else if (score <= 8) {
            strength = 'strong';
        } else {
            strength = 'very strong';
        }

        // Estimate crack time
        const estimatedCrackTime = this.estimateCrackTime(password);

        if (feedback.length === 0) {
            feedback.push('✓ Strong password!');
        }

        return {
            score,
            strength,
            feedback,
            estimatedCrackTime,
            entropy
        };
    }

    /**
     * Check if password is in common passwords list
     * @param password - Password to check
     * @returns True if common password
     */
    static isCommonPassword(password: string): boolean {
        return this.COMMON_PASSWORDS.includes(password.toLowerCase());
    }

    /**
     * Detect sequential characters
     * @param password - Password to check
     * @returns True if contains sequential chars
     */
    private static hasSequentialChars(password: string): boolean {
        const sequences = [
            'abcdefghijklmnopqrstuvwxyz',
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm',
            '0123456789'
        ];

        for (const seq of sequences) {
            for (let i = 0; i <= seq.length - 3; i++) {
                const substring = seq.substring(i, i + 3);
                if (password.toLowerCase().includes(substring)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculate password entropy (bits)
     * @param password - Password to analyze
     * @returns Entropy in bits
     */
    static calculateEntropy(password: string): number {
        let poolSize = 0;

        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

        return Math.log2(Math.pow(poolSize, password.length));
    }

    /**
     * Estimate time to crack password
     * Assumes 1 billion attempts per second (modern GPU)
     * @param password - Password to analyze
     * @returns Human-readable time estimate
     */
    static estimateCrackTime(password: string): string {
        let poolSize = 0;

        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

        const combinations = Math.pow(poolSize, password.length);
        const attemptsPerSecond = 1_000_000_000; // 1 billion attempts/sec
        const seconds = combinations / (attemptsPerSecond * 2); // Divide by 2 for average

        if (seconds < 1) return 'Instant';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;

        const years = seconds / 31536000;
        if (years < 1000000) return `${Math.round(years).toLocaleString()} years`;
        if (years < 1000000000) return `${Math.round(years / 1000000).toLocaleString()} million years`;

        return `${Math.round(years / 1000000000).toLocaleString()} billion years`;
    }

    /**
     * Simulate dictionary attack
     * @param passwordHash - Hash to crack
     * @returns Result with attempts and time
     */
    static async simulateDictionaryAttack(passwordHash: string): Promise<{
        success: boolean;
        password?: string;
        attempts: number;
        timeTaken: number;
    }> {
        const startTime = Date.now();
        let attempts = 0;

        for (const password of this.COMMON_PASSWORDS) {
            attempts++;
            const hash = HashUtil.sha256(password);

            if (hash === passwordHash) {
                return {
                    success: true,
                    password,
                    attempts,
                    timeTaken: Date.now() - startTime
                };
            }
        }

        return {
            success: false,
            attempts,
            timeTaken: Date.now() - startTime
        };
    }

    /**
     * Simulate brute force attack (limited for demo)
     * @param passwordHash - Hash to crack
     * @param maxLength - Maximum password length to try
     * @returns Result with attempts
     */
    static async simulateBruteForce(
        passwordHash: string,
        maxLength: number = 4
    ): Promise<{
        success: boolean;
        password?: string;
        attempts: number;
        timeTaken: number;
    }> {
        const startTime = Date.now();
        let attempts = 0;
        const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Try passwords from length 1 to maxLength
        for (let length = 1; length <= maxLength; length++) {
            const result = await this.tryAllCombinations(
                charset,
                length,
                passwordHash,
                attempts
            );

            attempts = result.attempts;

            if (result.found) {
                return {
                    success: true,
                    password: result.password,
                    attempts,
                    timeTaken: Date.now() - startTime
                };
            }

            // Limit attempts for demonstration
            if (attempts > 10000) {
                break;
            }
        }

        return {
            success: false,
            attempts,
            timeTaken: Date.now() - startTime
        };
    }

    /**
     * Try all combinations for brute force
     */
    private static async tryAllCombinations(
        charset: string,
        length: number,
        targetHash: string,
        initialAttempts: number
    ): Promise<{ found: boolean; password?: string; attempts: number }> {
        let attempts = initialAttempts;

        const generate = (current: string): { found: boolean; password?: string } => {
            if (current.length === length) {
                attempts++;
                const hash = HashUtil.sha256(current);
                if (hash === targetHash) {
                    return { found: true, password: current };
                }
                return { found: false };
            }

            for (const char of charset) {
                if (attempts > 10000) {
                    return { found: false };
                }

                const result = generate(current + char);
                if (result.found) {
                    return result;
                }
            }

            return { found: false };
        };

        const result = generate('');
        return { ...result, attempts };
    }

    /**
     * Generate secure random password
     * @param length - Password length
     * @param includeSymbols - Include special characters
     * @returns Random password
     */
    static generateSecurePassword(length: number = 16, includeSymbols: boolean = true): string {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = lowercase + uppercase + numbers;
        if (includeSymbols) {
            charset += symbols;
        }

        let password = '';
        const randomBytes = require('crypto').randomBytes(length);

        for (let i = 0; i < length; i++) {
            password += charset[randomBytes[i] % charset.length];
        }

        // Ensure at least one of each type
        if (!password.match(/[a-z]/)) password = password.slice(0, -1) + 'a';
        if (!password.match(/[A-Z]/)) password = password.slice(0, -1) + 'A';
        if (!password.match(/[0-9]/)) password = password.slice(0, -1) + '1';
        if (includeSymbols && !password.match(/[^a-zA-Z0-9]/)) {
            password = password.slice(0, -1) + '!';
        }

        return password;
    }

    /**
     * Get password recommendations
     * @returns Array of recommendations
     */
    static getPasswordRecommendations(): string[] {
        return [
            'Use at least 12 characters',
            'Mix uppercase and lowercase letters',
            'Include numbers and special characters',
            'Avoid common words and patterns',
            'Don\'t use personal information',
            'Use a unique password for each account',
            'Consider using a passphrase (e.g., "Coffee-Mountain-Sky-42!")',
            'Use a password manager',
            'Enable two-factor authentication'
        ];
    }
}
