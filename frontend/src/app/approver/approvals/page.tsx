'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, XCircle, Clock, Eye, Search } from 'lucide-react';

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');

    useEffect(() => {
        fetchApprovals();
    }, [statusFilter]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const { data } = await apiClient.getMyApprovals(status);
            setApprovals(data.approvals || []);
        } catch (error) {
            console.error('Error fetching approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (approvalId: number) => {
        if (!confirm('Are you sure you want to approve this quotation?')) return;

        try {
            await apiClient.approveQuotation(String(approvalId), 'Approved');
            fetchApprovals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to approve');
        }
    };

    const handleReject = async (approvalId: number) => {
        const comments = prompt('Please provide a reason for rejection:');
        if (!comments) return;

        try {
            await apiClient.rejectQuotation(String(approvalId), comments);
            fetchApprovals();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to reject');
        }
    };

    const filteredApprovals = approvals.filter((approval) => {
        const matchesSearch =
            approval.rfq_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            approval.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <ProtectedRoute allowedRoles={['approver']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Approval Management</h1>
                        <p className="text-muted-foreground">Review and approve quotations</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search approvals..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

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
                                    <div key={approval.id} className="p-6 hover:bg-secondary/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
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

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Quote Number</p>
                                                        <p className="text-foreground font-mono">{approval.quote_number || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vendor</p>
                                                        <p className="text-foreground">{approval.vendor_name || 'Unknown'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Amount</p>
                                                        <p className="text-foreground font-semibold">${approval.total_amount?.toLocaleString() || '0.00'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                {approval.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(approval.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(approval.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/approver/approvals/${approval.id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all text-center justify-center"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Link>
                                            </div>
                                        </div>

                                        {approval.comments && (
                                            <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground mb-1">Comments</p>
                                                <p className="text-foreground text-sm">{approval.comments}</p>
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
