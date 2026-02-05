import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-full mb-6">
                    <FileQuestion className="w-10 h-10 text-foreground" />
                </div>

                <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
                <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
                <p className="text-muted-foreground mb-8">
                    The page you're looking for doesn;t exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg transition-all"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
