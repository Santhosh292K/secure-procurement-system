'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { FileText, MessageSquare, CheckSquare, TrendingUp, Plus } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalRFQs: 0,
        activeRFQs: 0,
        totalQuotations: 0,
        pendingApprovals: 0,
    });
    const [recentRFQs, setRecentRFQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [rfqsRes, quotationsRes] = await Promise.all([
                apiClient.getRFQs({ limit: 5 }),
                apiClient.getQuotations({ limit: 10 }),
            ]);

            setRecentRFQs(rfqsRes.data.rfqs || []);

            setStats({
                totalRFQs: rfqsRes.data.total || 0,
                activeRFQs: rfqsRes.data.rfqs?.filter((r: any) => r.status === 'published').length || 0,
                totalQuotations: quotationsRes.data.quotations?.length || 0,
                pendingApprovals: quotationsRes.data.quotations?.filter((q: any) => q.status === 'submitted').length || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { name: 'Total RFQs', value: stats.totalRFQs, icon: FileText, color: 'bg-primary text-primary-foreground' },
        { name: 'Active RFQs', value: stats.activeRFQs, icon: TrendingUp, color: 'bg-secondary text-foreground' },
        { name: 'Total Quotations', value: stats.totalQuotations, icon: MessageSquare, color: 'bg-primary text-primary-foreground' },
        { name: 'Pending Approvals', value: stats.pendingApprovals, icon: CheckSquare, color: 'bg-secondary text-foreground' },
    ];

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Welcome Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
                            <p className="text-muted-foreground">Manage RFQs, quotations, and approvals</p>
                        </div>
                        <Link
                            href="/admin/rfqs/create"
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create RFQ
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat) => (
                            <div key={stat.name} className="bg-card rounded-xl p-6 border border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">{stat.name}</p>
                                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent RFQs */}
                    <div className="bg-card rounded-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-foreground">Recent RFQs</h2>
                                <Link
                                    href="/admin/rfqs"
                                    className="text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : recentRFQs.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No RFQs yet</p>
                                    <Link
                                        href="/admin/rfqs/create"
                                        className="text-primary hover:text-primary/80 text-sm mt-2 inline-block"
                                    >
                                        Create your first RFQ
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentRFQs.map((rfq) => (
                                        <Link
                                            key={rfq.id}
                                            href={`/admin/rfqs/${rfq.id}`}
                                            className="block p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent hover:border-primary/30"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="text-foreground font-semibold mb-1">{rfq.title}</h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-1">{rfq.description}</p>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${rfq.status === 'published'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : rfq.status === 'draft'
                                                            ? 'bg-secondary text-foreground'
                                                            : 'border border-primary text-primary'
                                                        }`}
                                                >
                                                    {rfq.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                <span>RFQ #{rfq.rfq_number}</span>
                                                <span>•</span>
                                                <span>Deadline: {new Date(rfq.deadline).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
