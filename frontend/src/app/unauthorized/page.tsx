import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full mb-6">
                    <ShieldAlert className="w-10 h-10 text-destructive" />
                </div>

                <h1 className="text-6xl font-bold text-foreground mb-4">403</h1>
                <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
                <p className="text-muted-foreground mb-8">
                    You don;t have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <Link
                    href="/login"
                    className="inline-block px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
