import React, { useState, useMemo } from 'react';
import { Budget, Transaction, TransactionType, Category, Saving } from '../types';
import AddBudgetModal from './AddBudgetModal';
import EditBudgetModal from './EditBudgetModal';
import BudgetCard from './BudgetCard';
import OverallBudgetCard from './OverallBudgetCard';
import OverallBudgetModal from './OverallBudgetModal';
import SavingsModal from './SavingsModal';
import { PlusCircleIcon } from './icons/ActionIcons';
import { SavingsIcon } from './icons/SavingsIcon';
import { formatCurrency } from '../utils/formatters';

interface BudgetsProps {
    overallBudget: Budget | null;
    categoryBudgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    savings: Saving[];
    onSetOverallBudget: (budgetData: { amount: number; month: number; year: number; }) => void;
    onAddCategoryBudget: (budget: Omit<Budget, 'id'>) => void;
    onEditCategoryBudget: (budgetId: string, amount: number) => void;
    onSetSaving: (savingData: { amount: number; month: number; year: number; }) => void;
}

const Budgets: React.FC<BudgetsProps> = ({ overallBudget, categoryBudgets, transactions, categories, savings, onSetOverallBudget, onAddCategoryBudget, onEditCategoryBudget, onSetSaving }) => {
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const [selectedMonthYear, setSelectedMonthYear] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);

    const [selectedYear, selectedMonth] = useMemo(() => {
        const [year, month] = selectedMonthYear.split('-').map(Number);
        return [year, month - 1]; // month is 0-indexed
    }, [selectedMonthYear]);
    
    const selectedMonthName = useMemo(() => {
        return new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedYear, selectedMonth]);

    const monthlyCategoryBudgets = categoryBudgets.filter(b => b.month === currentMonth && b.year === currentYear);
    
    const selectedSaving = useMemo(() => {
        return savings.find(s => s.month === selectedMonth && s.year === selectedYear);
    }, [savings, selectedMonth, selectedYear]);

    const { spendingByCategory, totalMonthlyExpenses } = useMemo(() => {
        const monthlyTransactions = transactions.filter(t => 
            new Date(t.date).getMonth() === currentMonth && 
            new Date(t.date).getFullYear() === currentYear
        );

        const expenses = monthlyTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const spending = monthlyTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as { [key: string]: number });

        return { 
            spendingByCategory: spending, 
            totalMonthlyExpenses: expenses,
        };
    }, [transactions, currentMonth, currentYear]);

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Monthly Budgets & Savings</h1>
                <p className="text-text-secondary">Track your spending for the current month and manage your savings history.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OverallBudgetCard 
                  budget={overallBudget} 
                  totalSpent={totalMonthlyExpenses} 
                  onSetBudget={() => setIsOverallModalOpen(true)} 
                />
                <div className="bg-white p-6 rounded-xl shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                                <h3 className="text-xl font-semibold text-text-primary">Monthly Savings</h3>
                                <p className="text-sm text-text-secondary">Select a month to view or edit savings.</p>
                            </div>
                            <input
                                type="month"
                                value={selectedMonthYear}
                                onChange={(e) => setSelectedMonthYear(e.target.value)}
                                className="px-3 py-2 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-text-muted mb-1">Savings for {selectedMonthName}</p>
                            <p className={`text-4xl font-bold ${selectedSaving && selectedSaving.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                {selectedSaving ? formatCurrency(selectedSaving.amount) : formatCurrency(0)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <button 
                            onClick={() => setIsSavingsModalOpen(true)}
                            className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                        >
                            {selectedSaving ? 'Edit Savings' : 'Set Savings'}
                        </button>
                    </div>
                </div>
            </div>


            <div className="flex justify-between items-center mt-12 mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Category Budgets (Current Month)</h2>
                <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                  <PlusCircleIcon className="w-5 h-5 mr-2" />
                  Create Category Budget
                </button>
            </div>

            {monthlyCategoryBudgets.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthlyCategoryBudgets.map(budget => (
                        <BudgetCard
                            key={budget.id}
                            budget={budget}
                            spentAmount={spendingByCategory[budget.category] || 0}
                            onEdit={() => setEditingBudget(budget)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-text-secondary py-16 bg-white rounded-xl shadow-neu-3d">
                    <p className="text-lg">You haven't set any category budgets for this month.</p>
                    <p className="mt-2">Click 'Create Category Budget' to get started!</p>
                </div>
            )}
           
            {isCategoryModalOpen && (
                <AddBudgetModal 
                    onClose={() => setIsCategoryModalOpen(false)} 
                    onAddBudget={onAddCategoryBudget}
                    existingCategories={monthlyCategoryBudgets.map(b => b.category)}
                    categories={categories.filter(c => c.type === TransactionType.EXPENSE)}
                />
            )}
            {isOverallModalOpen && (
                <OverallBudgetModal
                    onClose={() => setIsOverallModalOpen(false)}
                    onSave={onSetOverallBudget}
                    currentAmount={overallBudget?.amount}
                />
            )}
            {isSavingsModalOpen && (
                <SavingsModal
                    onClose={() => setIsSavingsModalOpen(false)}
                    onSave={onSetSaving}
                    currentAmount={selectedSaving?.amount}
                    month={selectedMonth}
                    year={selectedYear}
                />
            )}
            {editingBudget && (
                <EditBudgetModal
                    budget={editingBudget}
                    onClose={() => setEditingBudget(null)}
                    onSave={onEditCategoryBudget}
                />
            )}
        </div>
    );
};

export default Budgets;