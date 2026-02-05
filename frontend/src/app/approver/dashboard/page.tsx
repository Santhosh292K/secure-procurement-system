'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, Clock, XCircle, FileText, Eye } from 'lucide-react';

export default function ApproverDashboard() {
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        approved: 0,
        rejected: 0,
    });
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data } = await apiClient.getPendingApprovals();
            const approvals = data.approvals || [];

            setPendingApprovals(approvals.filter((a: any) => a.status === 'pending'));

            setStats({
                pendingApprovals: approvals.filter((a: any) => a.status === 'pending').length,
                approved: approvals.filter((a: any) => a.status === 'approved').length,
                rejected: approvals.filter((a: any) => a.status === 'rejected').length,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { name: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'from-orange-500 to-red-500' },
        { name: 'Approved', value: stats.approved, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
        { name: 'Rejected', value: stats.rejected, icon: XCircle, color: 'from-red-500 to-pink-500' },
    ];

    return (
        <ProtectedRoute allowedRoles={['approver']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Welcome Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Approver Dashboard</h1>
                        <p className="text-muted-foreground">Review and approve quotations</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {statCards.map((stat) => (
                            <div key={stat.name} className="bg-card rounded-xl p-6 border border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">{stat.name}</p>
                                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.name === 'Pending Approvals' ? 'bg-secondary text-foreground' :
                                            stat.name === 'Approved' ? 'bg-primary/10 text-primary' :
                                                'bg-destructive/10 text-destructive'
                                        }`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pending Approvals */}
                    <div className="bg-card rounded-xl border border-border">
                        <div className="p-6 border-b border-border">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-foreground">Pending Approvals</h2>
                                <Link
                                    href="/approver/approvals"
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
                            ) : pendingApprovals.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No pending approvals</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingApprovals.slice(0, 5).map((approval) => (
                                        <div
                                            key={approval.id}
                                            className="p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-foreground font-semibold mb-1">{approval.rfq_title}</h3>
                                                    <p className="text-muted-foreground text-sm">Quote #{approval.quote_number}</p>
                                                    <p className="text-muted-foreground text-sm mt-1">Vendor: {approval.vendor_name}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-3 py-1 bg-secondary text-foreground text-xs font-medium rounded-full">
                                                        Level {approval.level}
                                                    </span>
                                                    <Link
                                                        href={`/approver/approvals/${approval.id}`}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Review
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Amount: ${approval.total_amount?.toLocaleString()}</span>
                                                <span>•</span>
                                                <span>Submitted: {new Date(approval.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
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
