/**
 * OTP (One-Time Password) Utility
 * Handles OTP generation, storage, and verification
 */

interface OTPData {
    otp: string;
    email: string;
    purpose: 'signup' | 'login';
    data?: any; // Additional data for signup (user details)
    expiresAt: number;
    attempts: number;
}

class OTPUtil {
    private static otpStore = new Map<string, OTPData>();
    private static readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
    private static readonly MAX_ATTEMPTS = 3;
    private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

    /**
     * Initialize cleanup interval
     */
    static initialize() {
        // Clean up expired OTPs every minute
        setInterval(() => {
            this.cleanupExpiredOTPs();
        }, this.CLEANUP_INTERVAL_MS);
    }

    /**
     * Generate a random 6-digit OTP
     */
    static generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Store OTP with associated data
     */
    static storeOTP(
        token: string,
        email: string,
        purpose: 'signup' | 'login',
        additionalData?: any
    ): string {
        const otp = this.generateOTP();
        const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

        this.otpStore.set(token, {
            otp,
            email,
            purpose,
            data: additionalData,
            expiresAt,
            attempts: 0
        });

        console.log(`OTP stored for ${email}: ${otp} (expires in 5 minutes)`);
        return otp;
    }

    /**
     * Verify OTP
     */
    static verifyOTP(
        token: string,
        otp: string
    ): { success: boolean; error?: string; data?: OTPData } {
        const otpData = this.otpStore.get(token);

        if (!otpData) {
            return { success: false, error: 'Invalid or expired token' };
        }

        // Check expiration
        if (Date.now() > otpData.expiresAt) {
            this.otpStore.delete(token);
            return { success: false, error: 'OTP has expired' };
        }

        // Check attempts
        if (otpData.attempts >= this.MAX_ATTEMPTS) {
            this.otpStore.delete(token);
            return { success: false, error: 'Maximum verification attempts exceeded' };
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            otpData.attempts++;
            const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;

            if (remainingAttempts === 0) {
                this.otpStore.delete(token);
                return { success: false, error: 'Maximum verification attempts exceeded' };
            }

            return {
                success: false,
                error: `Incorrect OTP. ${remainingAttempts} attempt(s) remaining`
            };
        }

        // OTP verified successfully
        const data = { ...otpData };
        this.otpStore.delete(token); // Remove OTP after successful verification
        return { success: true, data };
    }

    /**
     * Check if token exists and is valid
     */
    static isValidToken(token: string): boolean {
        const otpData = this.otpStore.get(token);
        if (!otpData) return false;
        if (Date.now() > otpData.expiresAt) {
            this.otpStore.delete(token);
            return false;
        }
        return true;
    }

    /**
     * Get OTP data for resending
     */
    static getOTPData(token: string): OTPData | null {
        const otpData = this.otpStore.get(token);
        if (!otpData) return null;

        // Check expiration
        if (Date.now() > otpData.expiresAt) {
            this.otpStore.delete(token);
            return null;
        }

        return otpData;
    }

    /**
     * Regenerate OTP for existing token
     */
    static regenerateOTP(token: string): string | null {
        const otpData = this.otpStore.get(token);
        if (!otpData) return null;

        const newOTP = this.generateOTP();
        otpData.otp = newOTP;
        otpData.expiresAt = Date.now() + this.OTP_EXPIRY_MS;
        otpData.attempts = 0; // Reset attempts on resend

        console.log(`OTP regenerated for ${otpData.email}: ${newOTP}`);
        return newOTP;
    }

    /**
     * Clean up expired OTPs
     */
    private static cleanupExpiredOTPs() {
        const now = Date.now();
        let cleanupCount = 0;

        for (const [token, data] of this.otpStore.entries()) {
            if (now > data.expiresAt) {
                this.otpStore.delete(token);
                cleanupCount++;
            }
        }

        if (cleanupCount > 0) {
            console.log(`Cleaned up ${cleanupCount} expired OTP(s)`);
        }
    }

    /**
     * Get OTP store size (for debugging)
     */
    static getStoreSize(): number {
        return this.otpStore.size;
    }
}

export { OTPUtil };
