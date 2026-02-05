'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    DollarSign,
    Calendar,
    User
} from 'lucide-react';

export default function ApprovalDetailPage() {
    const params = useParams();
    const { user } = useAuthStore();
    const [approval, setApproval] = useState<any>(null);
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchApprovalDetails();
    }, [params.id]);

    const fetchApprovalDetails = async () => {
        try {
            const { data } = await apiClient.getApprovalById(params.id as string);
            setApproval(data.approval);

            // Fetch full quotation details
            if (data.approval.quotation_id) {
                const quotRes = await apiClient.getQuotationById(String(data.approval.quotation_id));
                setQuotation(quotRes.data.quotation);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load approval details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        const comments = prompt('Add approval comments (optional):') || 'Approved';
        setActionLoading(true);

        try {
            await apiClient.approveQuotation(params.id as string, comments);
            fetchApprovalDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to approve');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        const comments = prompt('Please provide a reason for rejection:');
        if (!comments) return;

        setActionLoading(true);
        try {
            await apiClient.rejectQuotation(params.id as string, comments);
            fetchApprovalDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to reject');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['approver']}>
                <DashboardLayout>
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error || !approval) {
        return (
            <ProtectedRoute allowedRoles={['approver']}>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Approval</h2>
                        <p className="text-gray-400 mb-6">{error || 'Approval not found'}</p>
                        <Link
                            href="/approver/approvals"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Approvals
                        </Link>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const isPending = approval.status === 'pending';
    const canTakeAction = isPending && approval.approver_id === user?.id;

    return (
        <ProtectedRoute allowedRoles={['approver']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <Link
                            href="/approver/approvals"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Approvals
                        </Link>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Approval Review - Level {approval.level}
                                </h1>
                                <p className="text-muted-foreground">Quote #{approval.quote_number}</p>
                            </div>
                            <span
                                className={`px-4 py-2 rounded-lg text-sm font-semibold ${approval.status === 'approved'
                                    ? 'bg-primary text-primary-foreground'
                                    : approval.status === 'rejected'
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-secondary text-foreground'
                                    }`}
                            >
                                {approval.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {canTakeAction && (
                        <div className="flex gap-4">
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Approve Quotation
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-5 h-5" />
                                Reject Quotation
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* RFQ Information */}
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-xl font-bold text-foreground mb-4">RFQ Information</h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-muted-foreground text-sm">RFQ Title</p>
                                        <p className="text-foreground font-semibold text-lg">{approval.rfq_title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-muted-foreground text-sm">RFQ Number</p>
                                            <p className="text-foreground font-mono">{approval.rfq_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-sm">Vendor</p>
                                            <p className="text-foreground">{approval.vendor_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quotation Details */}
                            {quotation && (
                                <>
                                    <div className="bg-card rounded-xl p-6 border border-border">
                                        <h2 className="text-xl font-bold text-foreground mb-4">Quotation Summary</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="p-4 bg-secondary/30 rounded-lg">
                                                <p className="text-muted-foreground text-sm mb-1">Total Amount</p>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {quotation.currency} ${quotation.total_amount?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-secondary/30 rounded-lg">
                                                <p className="text-muted-foreground text-sm mb-1">Delivery Time</p>
                                                <p className="text-xl font-semibold text-foreground">{quotation.delivery_time}</p>
                                            </div>
                                            <div className="p-4 bg-secondary/30 rounded-lg">
                                                <p className="text-muted-foreground text-sm mb-1">Validity</p>
                                                <p className="text-xl font-semibold text-foreground">{quotation.validity_period} days</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Line Items */}
                                    <div className="bg-card rounded-xl p-6 border border-border">
                                        <h2 className="text-xl font-bold text-foreground mb-4">Line Items</h2>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="text-left py-3 text-muted-foreground font-medium">Description</th>
                                                        <th className="text-right py-3 text-muted-foreground font-medium">Qty</th>
                                                        <th className="text-right py-3 text-muted-foreground font-medium">Unit Price</th>
                                                        <th className="text-right py-3 text-muted-foreground font-medium">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quotation.line_items?.map((item: any, index: number) => (
                                                        <tr key={index} className="border-b border-border">
                                                            <td className="py-3 text-foreground">{item.description}</td>
                                                            <td className="py-3 text-foreground text-right">{item.quantity}</td>
                                                            <td className="py-3 text-foreground text-right">
                                                                ${item.unit_price?.toLocaleString()}
                                                            </td>
                                                            <td className="py-3 text-foreground text-right font-semibold">
                                                                ${item.total?.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {quotation.notes && (
                                        <div className="bg-card rounded-xl p-6 border border-border">
                                            <h2 className="text-xl font-bold text-foreground mb-4">Vendor Notes</h2>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-foreground mb-4">Approval Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm">Approver</span>
                                        </div>
                                        <p className="text-foreground font-semibold">{approval.approver_name}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Approval Level</span>
                                        </div>
                                        <p className="text-foreground">Level {approval.level}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Submitted</span>
                                        </div>
                                        <p className="text-foreground">
                                            {new Date(approval.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {approval.approved_at && (
                                        <div>
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {approval.status === 'approved' ? 'Approved' : 'Rejected'} On
                                                </span>
                                            </div>
                                            <p className="text-foreground">
                                                {new Date(approval.approved_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {approval.comments && (
                                <div className="bg-card rounded-xl p-6 border border-border">
                                    <h3 className="text-lg font-bold text-foreground mb-3">Comments</h3>
                                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{approval.comments}</p>
                                </div>
                            )}

                            {!canTakeAction && isPending && (
                                <div className="bg-secondary border border-border rounded-lg p-4">
                                    <p className="text-muted-foreground text-sm">
                                        This approval is assigned to another approver.
                                    </p>
                                </div>
                            )}

                            {!isPending && (
                                <div className={`border rounded-lg p-4 ${approval.status === 'approved'
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-destructive/10 border-destructive'
                                    }`}>
                                    <p className={`text-sm font-semibold ${approval.status === 'approved' ? 'text-primary' : 'text-destructive'
                                        }`}>
                                        This quotation has been {approval.status}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
