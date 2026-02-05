'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    FileText,
    Edit,
    Trash2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

export default function RFQDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [rfq, setRfq] = useState<any>(null);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRFQDetails();
    }, [params.id]);

    const fetchRFQDetails = async () => {
        try {
            const [rfqRes, quotationsRes] = await Promise.all([
                apiClient.getRFQById(params.id as string),
                apiClient.getQuotations({ rfq_id: params.id as string }),
            ]);

            setRfq(rfqRes.data.rfq);
            setQuotations(quotationsRes.data.quotations || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load RFQ details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this RFQ? This action cannot be undone.')) return;

        try {
            await apiClient.deleteRFQ(params.id as string);
            router.push('/admin/rfqs');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete RFQ');
        }
    };

    const handlePublish = async () => {
        try {
            await apiClient.publishRFQ(params.id as string);
            fetchRFQDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to publish RFQ');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
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
            <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading RFQ</h2>
                        <p className="text-muted-foreground mb-6">{error || 'RFQ not found'}</p>
                        <Link
                            href="/admin/rfqs"
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

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <Link
                                href="/admin/rfqs"
                                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to RFQs
                            </Link>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-foreground">{rfq.title}</h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${rfq.status === 'published'
                                        ? 'bg-primary text-primary-foreground'
                                        : rfq.status === 'draft'
                                            ? 'bg-secondary text-foreground'
                                            : 'bg-destructive/10 text-destructive'
                                        }`}
                                >
                                    {rfq.status}
                                </span>
                            </div>
                            <p className="text-muted-foreground">RFQ #{rfq.rfq_number}</p>
                        </div>

                        <div className="flex gap-3">
                            {rfq.status === 'draft' && (
                                <button
                                    onClick={handlePublish}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Publish
                                </button>
                            )}
                            <Link
                                href={`/admin/rfqs/${params.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>

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

                            {/* Quotations */}
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h2 className="text-xl font-bold text-foreground mb-4">
                                    Received Quotations ({quotations.length})
                                </h2>
                                {quotations.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No quotations received yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {quotations.map((quote) => (
                                            <Link
                                                key={quote.id}
                                                href={`/admin/quotations/${quote.id}`}
                                                className="block p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-foreground font-semibold">Quote #{quote.quote_number}</p>
                                                        <p className="text-muted-foreground text-sm">Vendor: {quote.vendor_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-foreground font-semibold">
                                                            {quote.currency} ${quote.total_amount?.toLocaleString()}
                                                        </p>
                                                        <span
                                                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${quote.status === 'approved'
                                                                ? 'bg-primary text-primary-foreground'
                                                                : quote.status === 'rejected'
                                                                    ? 'bg-destructive/10 text-destructive'
                                                                    : 'bg-secondary text-foreground'
                                                                }`}
                                                        >
                                                            {quote.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-bold text-foreground mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Deadline</span>
                                        </div>
                                        <p className="text-foreground font-semibold">
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
                                            <span className="text-sm">Created</span>
                                        </div>
                                        <p className="text-foreground">
                                            {new Date(rfq.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">Last Updated</span>
                                        </div>
                                        <p className="text-foreground">
                                            {new Date(rfq.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
