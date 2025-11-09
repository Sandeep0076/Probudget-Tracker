import React from 'react';
import { Budget } from '../types';
import { BalanceIcon } from './icons/CardIcons';
import { formatCurrency } from '../utils/formatters';

interface BudgetSummaryCardProps {
    budget: Budget | null;
    totalSpent: number;
    onSetBudget: () => void;
    className?: string;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({ budget, totalSpent, onSetBudget, className }) => {
    const budgetAmount = budget?.amount || 0;
    const remainingAmount = budgetAmount - totalSpent;
    const percentageSpent = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
    
    let progressBarColor = 'bg-accent';
    if (percentageSpent > 100) {
        progressBarColor = 'bg-danger';
    } else if (percentageSpent > 80) {
        progressBarColor = 'bg-warning';
    }

    return (
        <div className={`bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-full flex flex-col justify-between ${className || ''}`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-text-secondary">Monthly Budget Remaining</h3>
                    <div className="text-accent"><BalanceIcon /></div>
                </div>
                {budget ? (
                    <>
                        <p className="text-3xl font-bold text-text-primary mt-2">{formatCurrency(remainingAmount)}</p>
                        <p className="text-xs text-text-secondary">
                           {percentageSpent.toFixed(0)}% of {formatCurrency(budgetAmount)} spent
                        </p>
                    </>
                ) : (
                     <p className="text-3xl font-bold text-text-primary mt-2">-</p>
                )}
            </div>
            {budget ? (
                <div className="mt-4">
                    <div className="w-full bg-surface shadow-inner rounded-full h-2.5">
                        <div 
                            className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} 
                            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <div className="mt-4 text-center">
                    <button onClick={onSetBudget} className="text-sm font-medium text-accent hover:text-accent/[0.8] transition-colors">
                        Set a budget to see your progress
                    </button>
                </div>
            )}
        </div>
    );
};

export default BudgetSummaryCard;