import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Transaction, Budget } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface BudgetVarianceChartProps {
    transactions: Transaction[];
    budgets: Budget[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const actual = payload.find((p: any) => p.dataKey === 'actual')?.payload.realActual || 0;
        const budget = payload.find((p: any) => p.dataKey === 'budget')?.payload.realBudget || 0;
        const variance = budget - actual;
        const isOverBudget = variance < 0;

        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-primary font-semibold mb-2">{label}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-text-secondary">Budget:</span>
                        <span className="font-medium">{formatCurrency(budget)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-text-secondary">Actual:</span>
                        <span className="font-medium">{formatCurrency(actual)}</span>
                    </div>
                    <div className="border-t border-border-shadow my-1 pt-1 flex justify-between gap-4">
                        <span className="text-text-secondary">Variance:</span>
                        <span className={`font-bold ${isOverBudget ? 'text-danger' : 'text-success'}`}>
                            {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(variance))}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const BudgetVarianceChart: React.FC<BudgetVarianceChartProps> = ({ transactions, budgets }) => {
    const chartData = useMemo(() => {
        const categorySpending: { [category: string]: number } = {};
        transactions.forEach(t => {
            categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
        });

        // Combine with budgets
        const data = budgets.map(b => {
            const actual = categorySpending[b.category] || 0;
            return {
                name: b.category,
                budget: Math.max(b.amount, 1),
                actual: Math.max(actual, 1),
                realBudget: b.amount,
                realActual: actual,
                variance: b.amount - actual,
                percentUsed: (actual / b.amount) * 100
            };
        });

        // Add categories with spending but no budget
        Object.keys(categorySpending).forEach(cat => {
            if (!budgets.find(b => b.category === cat)) {
                data.push({
                    name: cat,
                    budget: 1, // Log scale min
                    actual: Math.max(categorySpending[cat], 1),
                    realBudget: 0,
                    realActual: categorySpending[cat],
                    variance: -categorySpending[cat],
                    percentUsed: 100 // Technically infinite, but cap visual
                });
            }
        });

        return data.sort((a, b) => b.actual - a.actual);
    }, [transactions, budgets]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No budget data available</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Budget vs. Actual</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" horizontal={false} />
                        <XAxis type="number" hide scale="log" domain={['auto', 'auto']} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-light)' }} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-secondary)' }} />

                        <Bar dataKey="budget" name="Budget" fill="var(--color-surface-light)" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? 'var(--color-danger)' : 'var(--color-success)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BudgetVarianceChart;
