'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { MessageSquare, Search, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function VendorQuotationsPage() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const { data } = await apiClient.getQuotations({});
            setQuotations(data.quotations || []);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = quotations.filter((quote) => {
        const matchesSearch =
            quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.rfq_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            case 'submitted':
                return <Clock className="w-4 h-4" />;
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-primary text-primary-foreground';
            case 'rejected':
                return 'border border-primary text-primary';
            case 'submitted':
                return 'bg-secondary text-foreground';
            default:
                return 'bg-secondary/50 text-muted-foreground';
        }
    };

    return (
        <ProtectedRoute allowedRoles={['vendor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">My Quotations</h1>
                        <p className="text-muted-foreground">View and manage your submitted quotations</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search quotations..."
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
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Quotations List */}
                    <div className="bg-card rounded-xl border border-border shadow-sm">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredQuotations.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No quotations found</p>
                                <Link
                                    href="/vendor/rfqs"
                                    className="text-primary hover:underline text-sm mt-2 inline-block"
                                >
                                    View available RFQs →
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredQuotations.map((quote) => (
                                    <div key={quote.id} className="p-6 hover:bg-secondary/50 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-foreground">Quote #{quote.quote_number}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(quote.status)}`}>
                                                        {getStatusIcon(quote.status)}
                                                        {quote.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">RFQ Number</p>
                                                        <p className="text-foreground font-mono">{quote.rfq_number || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Total Amount</p>
                                                        <p className="text-foreground font-semibold">
                                                            {quote.currency} ${quote.total_amount?.toLocaleString() || '0.00'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Delivery Time</p>
                                                        <p className="text-foreground">{quote.delivery_time}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Submitted</p>
                                                        <p className="text-foreground">{new Date(quote.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/vendor/quotations/${quote.id}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all ml-4"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
                                        </div>
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
