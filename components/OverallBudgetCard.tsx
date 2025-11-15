import React from 'react';
import { Budget } from '../types';
import { formatCurrency } from '../utils/formatters';

interface OverallBudgetCardProps {
    budget: Budget | null;
    totalSpent: number;
    onSetBudget: () => void;
}

const OverallBudgetCard: React.FC<OverallBudgetCardProps> = ({ budget, totalSpent, onSetBudget }) => {

    const budgetAmount = budget?.amount || 0;
    const remainingAmount = budgetAmount - totalSpent;
    const percentageSpent = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
    
    console.log('[OverallBudgetCard] Budget amount (raw):', budgetAmount);
    console.log('[OverallBudgetCard] Total spent (raw):', totalSpent);
    console.log('[OverallBudgetCard] Remaining (raw):', remainingAmount);
    
    let progressBarColor = 'bg-accent';
    if (percentageSpent > 100) {
        progressBarColor = 'bg-danger';
    } else if (percentageSpent > 80) {
        progressBarColor = 'bg-warning';
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Overall Monthly Budget</h2>
                    <p className="text-text-secondary text-sm">Your total spending plan for the month.</p>
                </div>
                <button
                  onClick={onSetBudget}
                  className="mt-3 md:mt-0 px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all shadow-neu-sm"
                >
                    {budget ? 'Edit Budget' : 'Set Budget'}
                </button>
            </div>

            {budget ? (
                <div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-text-primary">{formatCurrency(totalSpent)}</span>
                        <span className="text-text-secondary">spent of {formatCurrency(budgetAmount)}</span>
                    </div>

                    <div className="w-full bg-surface shadow-inner rounded-full h-3 mb-2">
                        <div 
                            className={`${progressBarColor} h-3 rounded-full transition-all duration-500`} 
                            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                        ></div>
                    </div>
                    <div className="text-right text-sm font-medium">
                        <span className={remainingAmount >= 0 ? 'text-text-secondary' : 'text-danger'}>
                            {remainingAmount >= 0 ? `${formatCurrency(remainingAmount)} remaining` : `${formatCurrency(Math.abs(remainingAmount))} overspent`}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-center text-text-secondary py-8">
                    <p>You haven't set an overall budget for this month.</p>
                    <p className="text-sm">Click 'Set Budget' to create one.</p>
                </div>
            )}
        </div>
    );
};

export default OverallBudgetCard;
