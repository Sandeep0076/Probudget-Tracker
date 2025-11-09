import React, { useState } from 'react';
import { Budget, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface AddBudgetModalProps {
    onClose: () => void;
    onAddBudget: (budget: Omit<Budget, 'id'>) => void;
    existingCategories: string[];
    categories: Category[];
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ onClose, onAddBudget, existingCategories, categories }) => {
    
    const availableCategories = categories.filter(c => !existingCategories.includes(c.name));
    
    const [category, setCategory] = useState(availableCategories.length > 0 ? availableCategories[0].name : '');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || parseFloat(amount) <= 0) {
            alert('Please select a category and enter a valid amount.');
            return;
        }

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        onAddBudget({
            category,
            amount: parseFloat(amount),
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
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">Create New Budget</h2>
                
                {availableCategories.length === 0 ? (
                    <div className="text-center text-text-secondary py-8">
                        {categories.length > 0 ? (
                           <p>You have already created a budget for every available category this month.</p>
                        ) : (
                           <p>You must create an expense category before you can create a budget.</p>
                        )}
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                            <select
                                name="category"
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={commonInputClasses}
                                style={{ backgroundPosition: 'right 1rem center' }}
                            >
                                {availableCategories.map(cat => <option key={cat.id} value={cat.name} className="bg-background-end">{cat.name}</option>)}
                            </select>
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
                                Save Budget
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddBudgetModal;