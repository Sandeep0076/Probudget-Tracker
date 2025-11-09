import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface OverallBudgetModalProps {
    onClose: () => void;
    onSave: (budgetData: { amount: number; month: number; year: number; }) => void;
    currentAmount?: number;
}

const OverallBudgetModal: React.FC<OverallBudgetModalProps> = ({ onClose, onSave, currentAmount }) => {
    const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        onSave({
            amount: numericAmount,
            month: currentMonth,
            year: currentYear
        });
        onClose();
    };

    const commonInputClasses = "w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface backdrop-blur-xl p-8 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Set Overall Monthly Budget</h2>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Total Budget Amount</label>
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
                                placeholder="e.g., 2000.00"
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
                            Save Budget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OverallBudgetModal;