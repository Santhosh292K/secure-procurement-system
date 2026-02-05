'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function EditRFQPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        deadline: '',
        budget: '',
        status: 'draft'
    });

    useEffect(() => {
        fetchRFQ();
    }, [params.id]);

    const fetchRFQ = async () => {
        try {
            const { data } = await apiClient.getRFQById(params.id as string);
            const rfq = data.rfq;
            setFormData({
                title: rfq.title,
                description: rfq.description,
                requirements: rfq.requirements,
                deadline: rfq.deadline.split('T')[0],
                budget: rfq.budget || '',
                status: rfq.status
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load RFQ');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await apiClient.updateRFQ(params.id as string, {
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
            });
            router.push(`/admin/rfqs/${params.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update RFQ');
        } finally {
            setSaving(false);
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

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <Link
                            href={`/admin/rfqs/${params.id}`}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to RFQ
                        </Link>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Edit RFQ</h1>
                        <p className="text-muted-foreground">Update RFQ details and requirements</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    RFQ Title <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter RFQ title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Description <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Describe the project or procurement need"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Requirements <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="List detailed requirements and specifications"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Deadline <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Budget (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link
                                href={`/admin/rfqs/${params.id}`}
                                className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
