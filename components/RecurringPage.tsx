import React, { useState, useEffect } from 'react';
import { RecurringTransaction, TransactionType, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import RecurringTransactionListItem from './RecurringTransactionListItem';
import LabelAutocomplete from './LabelAutocomplete';

interface RecurringPageProps {
    recurringTransactions: RecurringTransaction[];
    categories: Category[];
    availableLabels: string[];
    onAddRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => void;
    onDeleteRecurringTransaction: (id: string) => void;
}

const RecurringPage: React.FC<RecurringPageProps> = ({ recurringTransactions, categories, availableLabels, onAddRecurringTransaction, onDeleteRecurringTransaction }) => {
    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [labels, setLabels] = useState<string[]>([]);

    const availableCategories = categories.filter(c => c.type === transactionType).map(c => c.name);

    useEffect(() => {
        const currentCategories = categories.filter(c => c.type === transactionType);
        setCategory(currentCategories.length > 0 ? currentCategories[0].name : '');
    }, [transactionType, categories]);

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setLabels([]);
        setStartDate(new Date().toISOString().split('T')[0]);
        const currentCategories = categories.filter(c => c.type === transactionType);
        setCategory(currentCategories.length > 0 ? currentCategories[0].name : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !category || !startDate) {
            alert('Please fill all fields');
            return;
        }

        onAddRecurringTransaction({
            amount: parseFloat(amount),
            description,
            category,
            startDate,
            type: transactionType,
            labels,
            frequency: 'monthly',
            dayOfMonth: new Date(startDate).getUTCDate(),
        });
        resetForm();
    };

    const commonInputClasses = "w-full px-4 py-3 bg-white/10 border-t border-l border-black/20 border-b border-r border-white/30 shadow-inner shadow-black/10 rounded-md text-slate-100 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors";

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Manage Recurring Transactions</h1>

            {/* Form Section */}
            <div className="w-full bg-white/20 backdrop-blur-xl p-8 rounded-xl border-t border-l border-white/40 border-b border-r border-black/20 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">Add New Recurring Transaction</h2>
                <div className="mb-6">
                    <div className="flex bg-white/10 border-t border-l border-black/20 border-b border-r border-white/30 rounded-lg p-1 shadow-inner shadow-black/20 max-w-sm">
                        <button type="button" onClick={() => setTransactionType(TransactionType.EXPENSE)} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${transactionType === TransactionType.EXPENSE ? 'bg-sky-500 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}>Expense</button>
                        <button type="button" onClick={() => setTransactionType(TransactionType.INCOME)} className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${transactionType === TransactionType.INCOME ? 'bg-green-500 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}>Income</button>
                    </div>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-1">Description</label>
                            <input type="text" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className={commonInputClasses} placeholder="e.g., Netflix Subscription" required />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-200 mb-1">Amount</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><span className="text-slate-400">$</span></div>
                                <input type="number" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${commonInputClasses} pl-8`} placeholder="0.00" required step="0.01" />
                            </div>
                        </div>
                    </div>

                     <div>
                        <label htmlFor="labels" className="block text-sm font-medium text-slate-200 mb-1">Labels (optional)</label>
                        <LabelAutocomplete
                            selectedLabels={labels}
                            availableLabels={availableLabels}
                            onLabelsChange={setLabels}
                            placeholder="Add a label and press Enter..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-200 mb-1">Category</label>
                            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={commonInputClasses} style={{ backgroundPosition: 'right 1rem center' }}>
                                {availableCategories.length === 0 && <option disabled>Create a category first</option>}
                                {availableCategories.map(cat => <option key={cat} value={cat} className="bg-brand-dark-blue">{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-slate-200 mb-1">Start Date</label>
                            <input type="date" name="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={commonInputClasses} />
                            <p className="text-xs text-slate-400 mt-1">The transaction will occur monthly on this day.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button type="submit" className="px-6 py-3 border border-sky-500 border-t-sky-300 border-b-sky-700 border-l-sky-300 border-r-sky-700 text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue/90 hover:bg-brand-blue transition-colors">Add Recurring Transaction</button>
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white/20 backdrop-blur-xl p-6 rounded-xl border-t border-l border-white/40 border-b border-r border-black/20">
                 <h2 className="text-xl font-semibold text-white mb-4">Existing Recurring Transactions</h2>
                 {recurringTransactions.length > 0 ? (
                    <ul>
                        {recurringTransactions.map(tx => (
                            <RecurringTransactionListItem key={tx.id} transaction={tx} onDelete={onDeleteRecurringTransaction} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-slate-300 py-16">
                        <p className="text-lg">No recurring transactions found.</p>
                        <p className="mt-2 text-sm">Use the form above to add a monthly subscription or income.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecurringPage;
