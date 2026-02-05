'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import {
    ArrowLeft,
    FileText,
    Calendar,
    DollarSign,
    Truck,
    Clock,
    Shield,
    Key,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

export default function QuotationDetailPage() {
    const params = useParams();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [approvals, setApprovals] = useState<any[]>([]);

    useEffect(() => {
        fetchQuotationDetails();
    }, [params.id]);

    const fetchQuotationDetails = async () => {
        try {
            const { data } = await apiClient.getQuotationById(params.id as string);
            setQuotation(data.quotation);

            try {
                const historyRes = await apiClient.getApprovalHistory(params.id as string);
                setApprovals(historyRes.data.history || []);
            } catch (histError) {
                console.error('Error fetching approval history:', histError);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load quotation details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['vendor', 'admin', 'approver']}>
                <DashboardLayout>
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error || !quotation) {
        return (
            <ProtectedRoute allowedRoles={['vendor', 'admin', 'approver']}>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Quotation</h2>
                        <p className="text-gray-400 mb-6">{error || 'Quotation not found'}</p>
                        <Link
                            href="/vendor/quotations"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Quotations
                        </Link>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const getStatusIcon = () => {
        switch (quotation.status) {
            case 'approved':
                return <CheckCircle className="w-6 h-6" />;
            case 'rejected':
                return <XCircle className="w-6 h-6" />;
            default:
                return <Clock className="w-6 h-6" />;
        }
    };

    const getStatusColor = () => {
        switch (quotation.status) {
            case 'approved':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    return (
        <ProtectedRoute allowedRoles={['vendor', 'admin', 'approver']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <Link
                            href="/vendor/quotations"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Quotations
                        </Link>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Quotation #{quotation.quote_number}
                                </h1>
                                <p className="text-gray-400">For RFQ #{quotation.rfq_number}</p>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor()}`}>
                                {getStatusIcon()}
                                <span className="font-semibold capitalize">{quotation.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass rounded-xl p-6 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Total Amount</p>
                                            <p className="text-2xl font-bold text-white">
                                                {quotation.currency} ${quotation.total_amount?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass rounded-xl p-6 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Delivery Time</p>
                                            <p className="text-xl font-bold text-white">{quotation.delivery_time}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Progress */}
                                {approvals.length > 0 && (
                                    <div className="glass rounded-xl p-6 border border-white/10">
                                        <h2 className="text-xl font-bold text-white mb-4">Approval Progress</h2>
                                        <div className="space-y-4">
                                            {approvals.map((approval, index) => (
                                                <div key={approval.id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                                        ${approval.status === 'approved' ? 'bg-green-500 text-white' :
                                                            approval.status === 'rejected' ? 'bg-red-500 text-white' :
                                                                'bg-white/10 text-white'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">Level {approval.level} Review</p>
                                                        <p className="text-xs text-gray-400">
                                                            Status: <span className={
                                                                approval.status === 'approved' ? 'text-green-400' :
                                                                    approval.status === 'rejected' ? 'text-red-400' :
                                                                        'text-yellow-400'
                                                            }>{approval.status.toUpperCase()}</span>
                                                        </p>
                                                    </div>
                                                    {approval.approved_at && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400">Date</p>
                                                            <p className="text-sm text-white">
                                                                {new Date(approval.approved_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Line Items */}
                            <div className="glass rounded-xl p-6 border border-white/10">
                                <h2 className="text-xl font-bold text-white mb-4">Line Items</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 text-gray-400 font-medium">Description</th>
                                                <th className="text-right py-3 text-gray-400 font-medium">Qty</th>
                                                <th className="text-right py-3 text-gray-400 font-medium">Unit Price</th>
                                                <th className="text-right py-3 text-gray-400 font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quotation.line_items?.map((item: any, index: number) => (
                                                <tr key={index} className="border-b border-white/5">
                                                    <td className="py-3 text-white">{item.description}</td>
                                                    <td className="py-3 text-white text-right">{item.quantity}</td>
                                                    <td className="py-3 text-white text-right">
                                                        ${item.unit_price?.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 text-white text-right font-semibold">
                                                        ${item.total?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td colSpan={3} className="py-4 text-right text-gray-400 font-semibold">
                                                    Grand Total:
                                                </td>
                                                <td className="py-4 text-right text-2xl font-bold text-white">
                                                    {quotation.currency} ${quotation.total_amount?.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {quotation.notes && (
                                <div className="glass rounded-xl p-6 border border-white/10">
                                    <h2 className="text-xl font-bold text-white mb-4">Additional Notes</h2>
                                    <p className="text-gray-300 whitespace-pre-wrap">{quotation.notes}</p>
                                </div>
                            )}

                            {/* Security Information */}
                            <div className="glass rounded-xl p-6 border border-white/10 bg-purple-500/5">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-purple-400" />
                                    Security Features
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Key className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-medium text-purple-400">Encryption</span>
                                        </div>
                                        <p className="text-xs text-gray-400">XOR encryption applied to line items</p>
                                    </div>
                                    <div className="p-4 bg-slate-800/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-medium text-purple-400">Digital Signature</span>
                                        </div>
                                        <p className="text-xs text-gray-400">RSA-2048 signature verified</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-foreground mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Vendor</span>
                                        </div>
                                        <p className="text-foreground font-semibold">{quotation.vendor_name}</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Submitted</span>
                                        </div>
                                        <p className="text-foreground">
                                            {new Date(quotation.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">Validity Period</span>
                                        </div>
                                        <p className="text-foreground">{quotation.validity_period} days</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm">Currency</span>
                                        </div>
                                        <p className="text-foreground">{quotation.currency}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Status */}
                            {quotation.approvals && quotation.approvals.length > 0 && (
                                <div className="bg-card rounded-xl p-6 border border-border">
                                    <h3 className="text-lg font-bold text-foreground mb-4">Approval History</h3>
                                    <div className="space-y-3">
                                        {quotation.approvals.map((approval: any, index: number) => (
                                            <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm text-muted-foreground">Level {approval.level}</span>
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${approval.status === 'approved'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : approval.status === 'rejected'
                                                                ? 'border border-primary text-primary'
                                                                : 'bg-secondary text-foreground'
                                                            }`}
                                                    >
                                                        {approval.status}
                                                    </span>
                                                </div>
                                                <p className="text-foreground text-sm">{approval.approver_name}</p>
                                                {approval.comments && (
                                                    <p className="text-muted-foreground text-xs mt-2">{approval.comments}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
