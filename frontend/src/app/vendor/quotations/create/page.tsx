'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';

function CreateQuotationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rfqId = searchParams.get('rfqId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        rfq_id: rfqId || '',
        total_amount: '',
        currency: 'USD',
        delivery_time: '',
        validity_period: '',
        notes: '',
    });

    const [lineItems, setLineItems] = useState([
        { description: '', quantity: '', unitPrice: '', total: '' },
    ]);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: '', unitPrice: '', total: '' }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: string, value: string) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'quantity' || field === 'unitPrice') {
            const qty = parseFloat(updated[index].quantity) || 0;
            const price = parseFloat(updated[index].unitPrice) || 0;
            updated[index].total = (qty * price).toFixed(2);
        }

        setLineItems(updated);

        const total = updated.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        setFormData({ ...formData, total_amount: total.toFixed(2) });
    };

    const handleSubmit = async (e: React.FormEvent, submit = false) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const quotationData = {
                rfqId: parseInt(formData.rfq_id),
                totalAmount: parseFloat(formData.total_amount),
                currency: formData.currency,
                deliveryTime: formData.delivery_time,
                validityPeriod: parseInt(formData.validity_period),
                notes: formData.notes,
                lineItems: lineItems.map(item => ({
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                })),
            };

            const { data } = await apiClient.createQuotation(quotationData);

            if (submit && data.quotation.id) {
                await apiClient.submitQuotation(data.quotation.id);
            }

            router.push('/vendor/quotations');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create quotation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['vendor']}>
            <DashboardLayout>
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Create Quotation</h1>
                        <p className="text-muted-foreground">Submit your quotation for RFQ</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
                            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Currency <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Delivery Time <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.delivery_time}
                                        onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                                        className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g., 2-3 weeks"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Validity (days) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.validity_period}
                                        onChange={(e) => setFormData({ ...formData, validity_period: e.target.value })}
                                        className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="30"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-foreground">Line Items</h3>
                                <button
                                    type="button"
                                    onClick={addLineItem}
                                    className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                            className="flex-1 px-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                            className="w-24 px-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={item.unitPrice}
                                            onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                                            className="w-32 px-4 py-2 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            required
                                        />
                                        <div className="w-32 px-4 py-2 bg-secondary/50 border border-transparent rounded-lg text-muted-foreground">
                                            ${item.total || '0.00'}
                                        </div>
                                        {lineItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLineItem(index)}
                                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {formData.currency} ${formData.total_amount || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-card rounded-xl p-6 border border-border">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-secondary border border-transparent focus:border-primary rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Add any additional terms, conditions, or notes..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
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
                                className="flex items-center gap-2 px-6 py-3 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg transition-all disabled:opacity-50"
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
                                {loading ? 'Submitting...' : 'Submit Quotation'}
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}

export default function CreateQuotationPage() {
    return (
        <Suspense fallback={
            <ProtectedRoute allowedRoles={['vendor']}>
                <DashboardLayout>
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Create Quotation</h1>
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        }>
            <CreateQuotationForm />
        </Suspense>
    );
}
