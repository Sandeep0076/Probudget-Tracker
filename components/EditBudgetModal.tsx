import React, { useState } from 'react';
import { Budget } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface EditBudgetModalProps {
    budget: Budget;
    onClose: () => void;
    onSave: (budgetId: string, amount: number) => void;
}

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ budget, onClose, onSave }) => {
    const [amount, setAmount] = useState(String(budget.amount));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }
        onSave(budget.id, numericAmount);
        onClose();
    };

    const commonInputClasses = "w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface backdrop-blur-xl p-8 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Edit Budget</h2>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                        <div className="px-4 py-3 bg-surface/50 border border-border-shadow rounded-md text-text-primary">
                            {budget.category}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Budget Amount</label>
                        <div className="relative">
                           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <span className="text-text-muted">$</span>
                            </div>
                            <input
                                type="number"
                                name="amount"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`${commonInputClasses} pl-8`}
                                placeholder="0.00"
                                required
                                step="0.01"
                                min="0.01"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-3 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBudgetModal;