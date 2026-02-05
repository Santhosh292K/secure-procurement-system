'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Save, X, AlertCircle } from 'lucide-react';

export default function CreateRFQPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        deadline: '',
        budget: '',
    });

    const handleSubmit = async (e: React.FormEvent, publish = false) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await apiClient.createRFQ({
                ...formData,
                budget: formData.budget ? parseFloat(formData.budget) : undefined,
                status: publish ? 'published' : 'draft',
            });

            if (publish && data.rfq.id) {
                await apiClient.publishRFQ(data.rfq.id);
            }

            router.push('/admin/rfqs');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create RFQ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Create New RFQ</h1>
                        <p className="text-muted-foreground">Create a new request for quotation</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => handleSubmit(e, false)} className="bg-card rounded-xl p-8 border border-border space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Title <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="e.g., Office Furniture Procurement 2024"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Description <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Provide a detailed description of what you're looking for..."
                                required
                            />
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Requirements <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="List all specific requirements, specifications, and criteria..."
                                required
                            />
                        </div>

                        {/* Deadline & Budget */}
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
                                    step="0.01"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Save as Draft
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Creating...' : 'Publish RFQ'}
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
