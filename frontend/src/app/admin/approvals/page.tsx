'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter } from 'lucide-react';

export default function AdminApprovalsPage() {
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchApprovals();
    }, [statusFilter]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const { data } = await apiClient.getAllApprovals(status);
            setApprovals(data.approvals || []);
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApprovals = approvals.filter((approval) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            approval.rfq_title?.toLowerCase().includes(searchLower) ||
            approval.quote_number?.toLowerCase().includes(searchLower) ||
            approval.vendor_name?.toLowerCase().includes(searchLower) ||
            approval.approver_name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">System Approvals</h1>
                        <p className="text-muted-foreground">Monitor all quotation approvals</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by RFQ, Vendor, or Approver..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-muted-foreground" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Approvals List */}
                    <div className="bg-card rounded-xl border border-border">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredApprovals.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No approvals found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredApprovals.map((approval) => (
                                    <div key={approval.id} className="p-6 hover:bg-secondary/50 transition-all">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-foreground">{approval.rfq_title || 'Untitled RFQ'}</h3>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${approval.status === 'approved'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : approval.status === 'rejected'
                                                                ? 'bg-destructive/10 text-destructive'
                                                                : 'bg-secondary text-foreground'
                                                            }`}
                                                    >
                                                        {approval.status}
                                                    </span>
                                                    <span className="px-3 py-1 bg-secondary text-foreground text-xs font-medium rounded-full">
                                                        Level {approval.level}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Quote Number</p>
                                                        <p className="text-foreground font-mono">{approval.quote_number || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vendor</p>
                                                        <p className="text-foreground">{approval.vendor_name || 'Unknown'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Assigned Approver</p>
                                                        <p className="text-foreground">{approval.approver_name || 'Unknown'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Amount</p>
                                                        <p className="text-foreground font-semibold">${approval.total_amount?.toLocaleString() || '0.00'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <Link
                                                    href={`/admin/approvals/${approval.id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Link>
                                            </div>
                                        </div>

                                        {approval.comments && (
                                            <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-1 h-full bg-primary rounded-full"></div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Approver Comments</p>
                                                        <p className="text-foreground text-sm">{approval.comments}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
