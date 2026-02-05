'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    CheckSquare,
    LogOut,
    Menu,
    X,
    User,
    Building2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles: ('admin' | 'vendor' | 'approver')[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendor', 'approver'] },
    { name: 'RFQs', href: '/rfqs', icon: FileText, roles: ['admin', 'vendor'] },
    { name: 'Quotations', href: '/quotations', icon: MessageSquare, roles: ['vendor', 'admin'] },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['approver', 'admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const rolePrefix = user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/approver';

    const filteredNav = navigation.filter(item =>
        user && item.roles.includes(user.role)
    );
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Procurement</h1>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {filteredNav.map((item) => {
                            const isActive = pathname.startsWith(rolePrefix + item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={rolePrefix + item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 mb-3 px-4 py-2">
                            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
                    <div className="flex items-center justify-between p-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-foreground"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-foreground hidden lg:block">
                            {filteredNav.find(item => pathname.startsWith(rolePrefix + item.href))?.name || 'Dashboard'}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
