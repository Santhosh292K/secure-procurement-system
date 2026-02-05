'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Search, FileText, Eye, Plus } from 'lucide-react';

export default function VendorRFQsPage() {
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRFQs();
    }, []);

    const fetchRFQs = async () => {
        try {
            const { data } = await apiClient.getRFQs({ status: 'published' });
            setRfqs(data.rfqs || []);
        } catch (error) {
            console.error('Error fetching RFQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRFQs = rfqs.filter((rfq) =>
        rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ProtectedRoute allowedRoles={['vendor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Available RFQs</h1>
                        <p className="text-gray-400">View published RFQs and submit your quotations</p>
                    </div>

                    {/* Search */}
                    <div className="glass rounded-xl p-4 border border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search RFQs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* RFQs Grid */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : filteredRFQs.length === 0 ? (
                        <div className="glass rounded-xl p-12 border border-white/10 text-center">
                            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No RFQs available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredRFQs.map((rfq) => (
                                <div key={rfq.id} className="glass rounded-xl p-6 border border-white/10 hover:border-primary-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-white mb-2">{rfq.title}</h3>
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{rfq.description}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">RFQ Number:</span>
                                            <span className="text-white font-mono">{rfq.rfq_number}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Deadline:</span>
                                            <span className="text-white">{new Date(rfq.deadline).toLocaleDateString()}</span>
                                        </div>
                                        {rfq.budget && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Budget:</span>
                                                <span className="text-white">${rfq.budget.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            href={`/vendor/rfqs/${rfq.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </Link>
                                        <Link
                                            href={`/vendor/quotations/create?rfqId=${rfq.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Submit Quote
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
