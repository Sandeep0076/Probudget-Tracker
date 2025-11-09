import React from 'react';
import { Budget } from '../types';
import { GroceriesIcon, UtilitiesIcon, TransportIcon, EntertainmentIcon, HealthIcon } from './icons/CategoryIcons';
import { formatCurrency } from '../utils/formatters';

interface BudgetCardProps {
    budget: Budget;
    spentAmount: number;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
    'Groceries': <GroceriesIcon />,
    'Utilities': <UtilitiesIcon />,
    'Transport': <TransportIcon />,
    'Entertainment': <EntertainmentIcon />,
    'Health': <HealthIcon />,
    'Other': <div className="text-text-muted text-xs font-mono">...</div>,
};

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, spentAmount }) => {
    const remainingAmount = budget.amount - spentAmount;
    const percentageSpent = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
    
    let progressBarColor = 'bg-accent';
    if (percentageSpent > 100) {
        progressBarColor = 'bg-danger';
    } else if (percentageSpent > 75) {
        progressBarColor = 'bg-warning';
    }

    return (
        <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-surface shadow-inner text-accent">
                        {categoryIcons[budget.category] || categoryIcons['Other']}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">{budget.category}</h3>
                </div>
                <div className="text-sm font-medium text-text-secondary">
                    {formatCurrency(budget.amount)}
                </div>
            </div>

            <div className="space-y-2">
                <div className="w-full bg-surface shadow-inner rounded-full h-2.5">
                    <div 
                        className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`} 
                        style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Spent: {formatCurrency(spentAmount)}</span>
                    <span className={remainingAmount >= 0 ? 'text-text-secondary' : 'text-danger'}>
                        {remainingAmount >= 0 ? `Remaining: ${formatCurrency(remainingAmount)}` : `Overspent: ${formatCurrency(Math.abs(remainingAmount))}`}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BudgetCard;
