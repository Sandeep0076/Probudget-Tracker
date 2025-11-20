import React, { useState, useEffect } from 'react';
import { RecurringTransaction, TransactionType, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import LabelAutocomplete from './LabelAutocomplete';

interface EditRecurringTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: RecurringTransaction) => void;
    transaction: RecurringTransaction;
    categories: Category[];
    availableLabels: string[];
}

const EditRecurringTransactionModal: React.FC<EditRecurringTransactionModalProps> = ({ isOpen, onClose, onSave, transaction, categories, availableLabels }) => {
    const [formData, setFormData] = useState<RecurringTransaction>(transaction);

    useEffect(() => {
        setFormData(transaction);
    }, [transaction]);

    if (!isOpen) return null;

    const availableCategories = categories.filter(c => c.type === formData.type).map(c => c.name);

    const handleTypeChange = (type: TransactionType) => {
        const newCategories = categories.filter(c => c.type === type);
        setFormData({
            ...formData,
            type,
            category: newCategories.length > 0 ? newCategories[0].name : ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else if (name === 'startDate') {
            setFormData(prev => ({
                ...prev,
                startDate: value,
                dayOfMonth: new Date(value).getUTCDate()
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description || !formData.category || !formData.startDate) {
            alert('Please fill all fields');
            return;
        }
        onSave(formData);
    };

    const commonInputClasses = "w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-surface backdrop-blur-xl p-8 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Edit Recurring Transaction</h2>
                
                <div className="mb-6">
                    <div className="flex bg-surface shadow-inner rounded-lg p-1">
                        <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === TransactionType.EXPENSE ? 'bg-accent text-white shadow-neu-sm' : 'text-text-secondary hover:bg-surface/70'}`}>
                            Expense
                        </button>
                        <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === TransactionType.INCOME ? 'bg-success text-white shadow-neu-sm' : 'text-text-secondary hover:bg-surface/70'}`}>
                            Income
                        </button>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                            <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Netflix Subscription" required />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><span className="text-text-muted">$</span></div>
                                <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} className={`${commonInputClasses} pl-8`} placeholder="0.00" required step="0.01" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="labels" className="block text-sm font-medium text-text-secondary mb-1">Labels (optional)</label>
                        <LabelAutocomplete
                            selectedLabels={formData.labels}
                            availableLabels={availableLabels}
                            onLabelsChange={(labels) => setFormData(prev => ({ ...prev, labels }))}
                            placeholder="Add a label and press Enter..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                            <select name="category" id="category" value={formData.category} onChange={handleChange} className={commonInputClasses} style={{ backgroundPosition: 'right 1rem center' }}>
                                {availableCategories.length === 0 && <option disabled>No categories for this type</option>}
                                {availableCategories.map(cat => <option key={cat} value={cat} className="bg-background-end">{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                            <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} className={commonInputClasses} />
                            <p className="text-xs text-text-muted mt-1">The transaction will occur monthly on this day.</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">Cancel</button>
                        <button type="submit" className="px-6 py-3 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRecurringTransactionModal;

