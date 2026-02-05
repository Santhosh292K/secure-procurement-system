'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await apiClient.login({ email, password });
            setAuth(data.user, data.accessToken, data.refreshToken);

            // Redirect based on role
            const dashboardPath = data.user.role === 'admin'
                ? '/admin/dashboard'
                : data.user.role === 'vendor'
                    ? '/vendor/dashboard'
                    : '/approver/dashboard';

            router.push(dashboardPath);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to your procurement account</p>
                </div>

                {/* Login Form */}
                <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                                    placeholder="admin@procurement.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold">Demo Credentials:</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p>Admin: admin@procurement.com / admin123</p>
                            <p>Vendor: vendor1@techsolutions.com / vendor123</p>
                            <p>Approver: approver1@procurement.com / approver123</p>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center pt-6 border-t border-border">
                        <p className="text-muted-foreground text-sm">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-sm mt-6">
                    <Link href="/" className="text-primary hover:text-primary/80 transition">
                        ← Back to Home
                    </Link>
                </p>
            </div>
        </div>
    );
}
