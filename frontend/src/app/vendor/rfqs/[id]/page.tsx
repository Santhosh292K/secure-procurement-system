'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Calendar, DollarSign, FileText, Plus, AlertCircle } from 'lucide-react';

export default function VendorRFQDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [rfq, setRfq] = useState<any>(null);
    const [myQuotation, setMyQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRFQDetails();
    }, [params.id]);

    const fetchRFQDetails = async () => {
        try {
            const rfqRes = await apiClient.getRFQById(params.id as string);
            setRfq(rfqRes.data.rfq);

            // Check if vendor already submitted a quotation
            try {
                const quotationsRes = await apiClient.getQuotations({ rfq_id: params.id as string });
                const myQuote = quotationsRes.data.quotations?.find((q: any) => q.is_mine);
                if (myQuote) setMyQuotation(myQuote);
            } catch (err) {
                // No quotation yet
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load RFQ details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['vendor']}>
                <DashboardLayout>
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (error || !rfq) {
        return (
            <ProtectedRoute allowedRoles={['vendor']}>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading RFQ</h2>
                        <p className="text-muted-foreground mb-6">{error || 'RFQ not found'}</p>
                        <Link
                            href="/vendor/rfqs"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to RFQs
                        </Link>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const isExpired = new Date(rfq.deadline) < new Date();

    return (
        <ProtectedRoute allowedRoles={['vendor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <Link
                                href="/vendor/rfqs"
                                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to RFQs
                            </Link>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{rfq.title}</h1>
                            <p className="text-muted-foreground">RFQ #{rfq.rfq_number}</p>
                        </div>

                        <div className="flex gap-3">
                            {myQuotation ? (
                                <Link
                                    href={`/vendor/quotations/${myQuotation.id}`}
                                    className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                                >
                                    View My Quotation
                                </Link>
                            ) : !isExpired ? (
                                <Link
                                    href={`/vendor/quotations/create?rfqId=${rfq.id}`}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Submit Quotation
                                </Link>
                            ) : (
                                <div className="px-6 py-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                                    Deadline Expired
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Warning if expired */}
                    {isExpired && (
                        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-destructive font-semibold">This RFQ has expired</p>
                                <p className="text-destructive/80 text-sm">The deadline was {new Date(rfq.deadline).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}

                    {/* RFQ Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-xl font-bold text-foreground mb-4">Description</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{rfq.description}</p>
                            </div>

                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-xl font-bold text-foreground mb-4">Requirements</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{rfq.requirements}</p>
                            </div>

                            {myQuotation && (
                                <div className="bg-card rounded-xl p-6 border border-border bg-secondary/20">
                                    <h2 className="text-xl font-bold text-foreground mb-4">Your Quotation</h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Quote Number:</span>
                                            <span className="text-foreground font-mono">{myQuotation.quote_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="text-foreground font-semibold">
                                                {myQuotation.currency} ${myQuotation.total_amount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${myQuotation.status === 'approved'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : myQuotation.status === 'rejected'
                                                        ? 'border border-primary text-primary'
                                                        : 'bg-secondary text-foreground'
                                                    }`}
                                            >
                                                {myQuotation.status}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/vendor/quotations/${myQuotation.id}`}
                                            className="inline-block mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all"
                                        >
                                            View Full Details
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-foreground mb-4">RFQ Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Deadline</span>
                                        </div>
                                        <p className={`font-semibold ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
                                            {new Date(rfq.deadline).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {rfq.budget && (
                                        <div>
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="text-sm">Budget</span>
                                            </div>
                                            <p className="text-foreground font-semibold">${rfq.budget.toLocaleString()}</p>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Published</span>
                                        </div>
                                        <p className="text-foreground">
                                            {new Date(rfq.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!myQuotation && !isExpired && (
                                <div className="bg-card rounded-xl p-6 border border-border bg-secondary/10">
                                    <h3 className="text-lg font-bold text-foreground mb-3">Ready to Submit?</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Submit your competitive quotation before the deadline to participate in this procurement.
                                    </p>
                                    <Link
                                        href={`/vendor/quotations/create?rfqId=${rfq.id}`}
                                        className="block text-center px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all"
                                    >
                                        <Plus className="w-5 h-5 inline mr-2" />
                                        Submit Quotation
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
