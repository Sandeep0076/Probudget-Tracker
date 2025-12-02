import React, { useMemo } from 'react';
import { Saving } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface MonthlySavingsChartProps {
    savings: Saving[];
}

const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({ savings }) => {
    const chartData = useMemo(() => {
        if (savings.length === 0) return [];

        // Sort savings by year and month
        const sorted = [...savings].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Get last 12 months of data or all if less
        const last12 = sorted.slice(-12);

        return last12.map(s => ({
            label: new Date(s.year, s.month).toLocaleDateString('default', { month: 'short', year: 'numeric' }),
            amount: s.amount,
            month: s.month,
            year: s.year
        }));
    }, [savings]);

    const maxAmount = useMemo(() => {
        if (chartData.length === 0) return 0;
        return Math.max(...chartData.map(d => Math.abs(d.amount)));
    }, [chartData]);

    const totalSavings = useMemo(() => {
        return chartData.reduce((sum, d) => sum + d.amount, 0);
    }, [chartData]);

    const averageSavings = useMemo(() => {
        if (chartData.length === 0) return 0;
        return totalSavings / chartData.length;
    }, [totalSavings, chartData.length]);

    if (chartData.length === 0) {
        return (
            <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Savings History</h3>
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No Savings Data Available</p>
                    <p className="text-sm mt-2">Start tracking your monthly savings in the Budgets section</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Monthly Savings History</h3>
                    <p className="text-sm text-text-secondary mt-1">Track your savings over time</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 text-sm">
                    <div className="bg-surface/50 backdrop-blur-md px-4 py-2 rounded-lg">
                        <p className="text-text-muted text-xs">Total Savings</p>
                        <p className={`text-lg font-bold ${totalSavings >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(totalSavings)}
                        </p>
                    </div>
                    <div className="bg-surface/50 backdrop-blur-md px-4 py-2 rounded-lg">
                        <p className="text-text-muted text-xs">Avg. Per Month</p>
                        <p className={`text-lg font-bold ${averageSavings >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(averageSavings)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="relative h-80 px-2">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs text-text-muted pr-2">
                    <span>{formatCurrency(maxAmount)}</span>
                    <span>{formatCurrency(maxAmount * 0.75)}</span>
                    <span>{formatCurrency(maxAmount / 2)}</span>
                    <span>{formatCurrency(maxAmount / 4)}</span>
                    <span className="font-semibold text-text-secondary">€0</span>
                    <span>{formatCurrency(-maxAmount / 4)}</span>
                    <span>{formatCurrency(-maxAmount / 2)}</span>
                    <span>{formatCurrency(-maxAmount * 0.75)}</span>
                    <span>{formatCurrency(-maxAmount)}</span>
                </div>

                {/* Grid lines */}
                <div className="absolute left-14 right-0 top-0 bottom-10 flex flex-col justify-between">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className={`h-px ${i === 4 ? 'bg-border-shadow' : 'bg-border-shadow/30'}`} />
                    ))}
                </div>

                {/* Bars container */}
                <div className="relative h-full ml-14 pb-10">
                    {/* Zero baseline - centered */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-text-secondary/50 z-10" />

                    {/* Bars */}
                    <div className="relative h-full flex items-center justify-between gap-1 sm:gap-2">
                        {chartData.map((item, index) => {
                            const isPositive = item.amount >= 0;
                            const heightPercent = maxAmount > 0 ? (Math.abs(item.amount) / maxAmount) * 100 : 0;

                            return (
                                <div
                                    key={`${item.year}-${item.month}`}
                                    className="flex-1 flex flex-col items-center group relative h-full"
                                    style={{ minWidth: '20px', maxWidth: '60px' }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                                        <div className="bg-surface/95 backdrop-blur-xl border border-border-highlight rounded-lg px-3 py-2 shadow-xl min-w-max">
                                            <p className="text-xs font-medium text-text-primary whitespace-nowrap">{item.label}</p>
                                            <p className={`text-sm font-bold ${isPositive ? 'text-brand' : 'text-danger'}`}>
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 bg-surface/95 border-l border-b border-border-highlight rotate-45 -mt-1" />
                                    </div>

                                    {/* Bar - centered on zero line */}
                                    <div className="relative w-full h-full flex flex-col justify-center items-center">
                                        {isPositive ? (
                                            // Positive bar (grows upward from center)
                                            <div className="w-full flex flex-col justify-end items-center h-1/2">
                                                <div
                                                    className="w-full border-2 border-brand rounded-sm transition-all duration-300 group-hover:bg-brand/10 group-hover:border-brand-dark"
                                                    style={{ height: `${Math.min(heightPercent, 100)}%` }}
                                                />
                                            </div>
                                        ) : (
                                            // Negative bar (grows downward from center)
                                            <div className="w-full flex flex-col justify-start items-center h-1/2">
                                                <div
                                                    className="w-full border-2 border-danger rounded-sm transition-all duration-300 group-hover:bg-danger/10 group-hover:border-danger"
                                                    style={{ height: `${Math.min(heightPercent, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Month label */}
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-text-muted text-center whitespace-nowrap transform -rotate-45 origin-center">
                                        {item.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-12 pt-4 border-t border-border-shadow/50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand rounded-sm" />
                    <span className="text-sm text-text-secondary">Positive Savings (Gain)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-danger rounded-sm" />
                    <span className="text-sm text-text-secondary">Negative Savings (Debt)</span>
                </div>
            </div>
        </div>
    );
};

export default MonthlySavingsChart;