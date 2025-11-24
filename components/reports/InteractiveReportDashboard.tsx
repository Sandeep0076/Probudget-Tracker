import React, { useState, useMemo } from 'react';
import { Transaction, Saving, Budget, TransactionType, Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

import SpendingPieChart from './charts/SpendingPieChart';
import TimeSeriesLineChart from './charts/TimeSeriesLineChart';
import CategoryComparisonBarChart from './charts/CategoryComparisonBarChart';
import CumulativeAreaChart from './charts/CumulativeAreaChart';
import BudgetVarianceChart from './charts/BudgetVarianceChart';
import TopExpensesTable from './charts/TopExpensesTable';
import PeriodComparisonView from './charts/PeriodComparisonView';

interface InteractiveReportDashboardProps {
    transactions: Transaction[];
    savings: Saving[];
    categoryBudgets: Budget[];
    overallBudget: Budget | null;
    categories: Category[];
}

type ReportView = 'overview' | 'trends' | 'comparison' | 'budget-vs-actual';

const InteractiveReportDashboard: React.FC<InteractiveReportDashboardProps> = ({
    transactions,
    savings,
    categoryBudgets,
    overallBudget,
    categories
}) => {
    const [activeView, setActiveView] = useState<ReportView>('overview');
    const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year'>('this-month');
    const [viewMode, setViewMode] = useState<'budget' | 'total'>('budget');

    // --- Date Filtering Logic ---
    const { filteredTransactions, startDate, endDate, totalOutflow } = useMemo(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        // Reset to start/end of day for clean comparison
        end.setHours(23, 59, 59, 999);

        switch (dateRange) {
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last-month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
                break;
            case 'last-3-months':
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'last-6-months':
                start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
        }
        start.setHours(0, 0, 0, 0);

        const categoryMap = categories.reduce((acc, c) => {
            acc[c.name] = c.affectsBudget !== false;
            return acc;
        }, {} as Record<string, boolean>);

        // Filter for date and Expense type first
        const dateFiltered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end && t.type === TransactionType.EXPENSE;
        });

        // Calculate total outflow (everything including investments)
        const outflow = dateFiltered.reduce((sum, t) => sum + t.amount, 0);

        // Filter based on view mode
        const finalFiltered = dateFiltered.filter(t => {
            if (viewMode === 'total') return true; // Show everything
            return categoryMap[t.category] !== false; // Show only budget-affecting
        });

        return { filteredTransactions: finalFiltered, startDate: start, endDate: end, totalOutflow: outflow };
    }, [transactions, dateRange, categories, viewMode]);

    // --- Aggregations ---
    const totalSpent = useMemo(() => filteredTransactions.reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
    const excludedSpent = totalOutflow - totalSpent;

    return (
        <div className="space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Interactive Reports</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        {startDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Mode Toggle - Redesigned */}
                    <div className="relative inline-flex items-center bg-gradient-to-br from-surface/80 to-surface/60 backdrop-blur-xl p-1 rounded-2xl shadow-neu-3d border border-border-highlight/50">
                        <div
                            className={`absolute top-1 bottom-1 rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg transition-all duration-500 ease-out ${
                                viewMode === 'budget' ? 'left-1 right-[calc(50%+2px)]' : 'left-[calc(50%+2px)] right-1'
                            }`}
                        />
                        <button
                            onClick={() => setViewMode('budget')}
                            className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500 ease-out min-w-[120px] ${
                                viewMode === 'budget'
                                    ? 'text-white scale-105'
                                    : 'text-text-secondary hover:text-text-primary hover:scale-102'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Budget
                            </span>
                        </button>
                        <button
                            onClick={() => setViewMode('total')}
                            className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-500 ease-out min-w-[120px] ${
                                viewMode === 'total'
                                    ? 'text-white scale-105'
                                    : 'text-text-secondary hover:text-text-primary hover:scale-102'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Total
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-surface backdrop-blur-xl p-1.5 rounded-xl shadow-neu-sm border border-border-highlight">
                        {(['overview', 'trends', 'comparison', 'budget-vs-actual'] as ReportView[]).map((view) => (
                            <button
                                key={view}
                                onClick={() => setActiveView(view)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeView === view
                                    ? 'bg-brand text-white shadow-neu-sm'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                                    }`}
                            >
                                {view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="appearance-none pl-4 pr-10 py-2 bg-surface/50 backdrop-blur-md border border-border-shadow rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 shadow-neu-sm cursor-pointer hover:bg-surface/80 transition-colors"
                        >
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="last-3-months">Last 3 Months</option>
                            <option value="last-6-months">Last 6 Months</option>
                            <option value="this-year">This Year</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow group hover:scale-[1.02] transition-transform duration-300">
                    <h3 className="text-text-secondary text-sm font-medium mb-2">
                        {viewMode === 'budget' ? 'Budget Spending' : 'Total Outflow'}
                    </h3>
                    <div className="text-3xl font-bold text-text-primary bg-clip-text text-transparent bg-gradient-to-r from-brand to-accent">
                        {formatCurrency(totalSpent)}
                    </div>
                </div>

                {viewMode === 'budget' && excludedSpent > 0 && (
                    <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow group hover:scale-[1.02] transition-transform duration-300">
                        <h3 className="text-text-secondary text-sm font-medium mb-2">Investments & Transfers</h3>
                        <div className="text-3xl font-bold text-text-secondary">
                            {formatCurrency(excludedSpent)}
                        </div>
                        <p className="text-xs text-text-muted mt-1">Excluded from budget</p>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px] space-y-8">
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SpendingPieChart data={filteredTransactions} />
                        <TopExpensesTable data={filteredTransactions} />
                    </div>
                )}

                {activeView === 'trends' && (
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                            <TimeSeriesLineChart data={filteredTransactions} range={dateRange} />
                        </div>
                        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                            <CumulativeAreaChart data={filteredTransactions} />
                        </div>
                    </div>
                )}

                {activeView === 'comparison' && (
                    <div className="grid grid-cols-1 gap-8">
                        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                            <CategoryComparisonBarChart data={filteredTransactions} />
                        </div>
                        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                            <PeriodComparisonView data={transactions} categories={categories} includeExcluded={viewMode === 'total'} />
                        </div>
                    </div>
                )}

                {activeView === 'budget-vs-actual' && (
                    <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                        <BudgetVarianceChart transactions={filteredTransactions} budgets={categoryBudgets} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractiveReportDashboard;
