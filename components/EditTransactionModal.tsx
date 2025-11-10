import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Transaction) => void;
    transaction: Transaction;
    categories: Category[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, onSave, transaction, categories }) => {
    const [formData, setFormData] = useState<Transaction>(transaction);
    const [labelInput, setLabelInput] = useState('');

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
        setFormData(prev => ({ ...prev, [name]: name === 'amount' || name === 'quantity' ? parseFloat(value) || 0 : value }));
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newLabel = labelInput.trim().toLowerCase();
            if (newLabel && !formData.labels.includes(newLabel)) {
                setFormData(prev => ({ ...prev, labels: [...prev.labels, newLabel] }));
            }
            setLabelInput('');
        }
    };

    const removeLabel = (labelToRemove: string) => {
        setFormData(prev => ({ ...prev, labels: prev.labels.filter(label => label !== labelToRemove) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description || !formData.category) {
            alert('Please fill all fields');
            return;
        }
        const pending = labelInput.trim().toLowerCase();
        const finalLabels = pending && !formData.labels.includes(pending)
            ? [...formData.labels, pending]
            : formData.labels;
        onSave({ ...formData, labels: finalLabels });
    };

    const commonInputClasses = "w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-surface backdrop-blur-xl p-8 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Edit Transaction</h2>
                
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><span className="text-text-muted">€</span></div>
                                <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} className={`${commonInputClasses} pl-8`} placeholder="0.00" required step="0.01" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                            <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} className={commonInputClasses} required step="1" min="1" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Coffee with friends" required />
                    </div>
                    <div>
                        <label htmlFor="labels" className="block text-sm font-medium text-text-secondary mb-1">Labels (optional)</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-surface border border-border-shadow shadow-inner rounded-md">
                            {formData.labels.map(label => (
                                <span key={label} className="label-chip">
                                    {label}
                                    <button
                                        type="button"
                                        onClick={() => removeLabel(label)}
                                        className="label-chip__remove"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input type="text" id="labels" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={handleLabelKeyDown} className="bg-transparent flex-grow p-1 focus:outline-none text-text-primary placeholder-text-muted min-w-[160px]" placeholder="Add a label and press Enter..." />
                        </div>
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
                            <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={commonInputClasses} />
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

export default EditTransactionModal;
