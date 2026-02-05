'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { FileText, MessageSquare, Clock, CheckCircle, Eye } from 'lucide-react';

export default function VendorDashboard() {
    const [stats, setStats] = useState({
        availableRFQs: 0,
        myQuotations: 0,
        pendingQuotations: 0,
        approvedQuotations: 0,
    });
    const [availableRFQs, setAvailableRFQs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [rfqsRes, quotationsRes] = await Promise.all([
                apiClient.getRFQs({ status: 'published', limit: 5 }),
                apiClient.getQuotations({}),
            ]);

            setAvailableRFQs(rfqsRes.data.rfqs || []);
            const quotations = quotationsRes.data.quotations || [];

            setStats({
                availableRFQs: rfqsRes.data.total || 0,
                myQuotations: quotations.length,
                pendingQuotations: quotations.filter((q: any) => q.status === 'draft' || q.status === 'submitted').length,
                approvedQuotations: quotations.filter((q: any) => q.status === 'approved').length,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { name: 'Available RFQs', value: stats.availableRFQs, icon: FileText, color: 'from-blue-500 to-cyan-500' },
        { name: 'My Quotations', value: stats.myQuotations, icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
        { name: 'Pending Review', value: stats.pendingQuotations, icon: Clock, color: 'from-orange-500 to-red-500' },
        { name: 'Approved', value: stats.approvedQuotations, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    ];

    return (
        <ProtectedRoute allowedRoles={['vendor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Welcome Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Vendor Dashboard</h1>
                        <p className="text-gray-400">View available RFQs and manage your quotations</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat) => (
                            <div key={stat.name} className="glass rounded-xl p-6 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                                        <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Available RFQs */}
                    <div className="glass rounded-xl border border-white/10">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Available RFQs</h2>
                                <Link
                                    href="/vendor/rfqs"
                                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                                </div>
                            ) : availableRFQs.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">No RFQs available at the moment</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {availableRFQs.map((rfq) => (
                                        <div
                                            key={rfq.id}
                                            className="p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-all border border-transparent hover:border-primary-500/30"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-white font-semibold mb-1">{rfq.title}</h3>
                                                    <p className="text-gray-400 text-sm line-clamp-2">{rfq.description}</p>
                                                </div>
                                                <Link
                                                    href={`/vendor/rfqs/${rfq.id}`}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-sm rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>RFQ #{rfq.rfq_number}</span>
                                                <span>•</span>
                                                <span>Deadline: {new Date(rfq.deadline).toLocaleDateString()}</span>
                                                {rfq.budget && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Budget: ${rfq.budget.toLocaleString()}</span>
                                                    </>
                                                )}
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
