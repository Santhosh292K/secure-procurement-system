'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Shield, Mail, Lock, User, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import OTPInput from '@/components/auth/OTPInput';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'vendor',
        company: '',
    });
    const [tempToken, setTempToken] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const { data } = await apiClient.initiateSignup({
                fullName: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                companyName: formData.company || undefined,
            });

            setTempToken(data.tempToken);
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await apiClient.verifySignupOTP(tempToken, otp);
            setStep('success');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setLoading(true);

        try {
            await apiClient.resendOTP(tempToken);
            setResendCooldown(60);

            // Countdown timer
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // Success screen
    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="bg-card rounded-2xl p-8 border border-border shadow-lg max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Registration Successful!</h2>
                    <p className="text-muted-foreground mb-4">
                        Your account has been created. Redirecting to login...
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
            </div>
        );
    }

    // OTP Verification screen
    if (step === 'otp') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-2xl mb-4">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Verify Your Email</h1>
                        <p className="text-muted-foreground">
                            We&apos;ve sent a 6-digit verification code to
                        </p>
                        <p className="text-foreground font-medium mt-1">{formData.email}</p>
                    </div>

                    {/* OTP Form */}
                    <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3 mb-6">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-4 text-center">
                                    Enter Verification Code
                                </label>
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={loading}
                                    error={!!error}
                                />
                            </div>

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <div className="text-center pt-4 border-t border-border">
                                <p className="text-muted-foreground text-sm mb-2">
                                    Didn&apos;t receive the code?
                                </p>
                                <button
                                    onClick={handleResendOTP}
                                    disabled={loading || resendCooldown > 0}
                                    className="text-primary hover:text-primary/80 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendCooldown > 0
                                        ? `Resend in ${resendCooldown}s`
                                        : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Back to form */}
                    <p className="text-center text-muted-foreground text-sm mt-6">
                        <button
                            onClick={() => setStep('form')}
                            className="text-primary hover:text-primary/80 transition"
                        >
                            ← Change email address
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    // Registration Form
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-2xl mb-4">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
                    <p className="text-muted-foreground">Join the Secure Procurement System</p>
                </div>

                {/* Registration Form */}
                <div className="bg-card rounded-2xl p-8 border border-border shadow-lg animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Full Name <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email Address <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Account Type <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    required
                                >
                                    <option value="vendor">Vendor</option>
                                    <option value="approver">Approver</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formData.role === 'vendor' && 'Submit quotations for RFQs'}
                                {formData.role === 'approver' && 'Review and approve quotations'}
                                {formData.role === 'admin' && 'Manage RFQs and system'}
                            </p>
                        </div>

                        {/* Company (Optional for Vendors) */}
                        {formData.role === 'vendor' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Company Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Your Company Ltd."
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Password <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Confirm Password <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending Code...' : 'Continue'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center pt-4 border-t border-border">
                            <p className="text-muted-foreground text-sm">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-xs mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
