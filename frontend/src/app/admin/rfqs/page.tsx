'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, FileText, Calendar, Eye } from 'lucide-react';

export default function RFQsPage() {
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchRFQs();
    }, []);

    const fetchRFQs = async () => {
        try {
            const { data } = await apiClient.getRFQs({});
            setRfqs(data.rfqs || []);
        } catch (error) {
            console.error('Error fetching RFQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRFQs = rfqs.filter((rfq) => {
        const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">RFQ Management</h1>
                            <p className="text-muted-foreground">Create and manage requests for quotations</p>
                        </div>
                        <Link
                            href="/admin/rfqs/create"
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create RFQ
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search RFQs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* RFQs List */}
                    <div className="bg-card rounded-xl border border-border">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredRFQs.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No RFQs found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredRFQs.map((rfq) => (
                                    <div key={rfq.id} className="p-6 hover:bg-secondary/30 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-foreground">{rfq.title}</h3>
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
                                                <p className="text-muted-foreground mb-3">{rfq.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        RFQ #{rfq.rfq_number}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/admin/rfqs/${rfq.id}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
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
