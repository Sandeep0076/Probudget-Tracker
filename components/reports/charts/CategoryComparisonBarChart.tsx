import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface CategoryComparisonBarChartProps {
    data: Transaction[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b', '#f43f5e', '#38bdf8', '#e11d48', '#fbbf24', '#4ade80', '#c084fc'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-primary font-semibold mb-2">{label}</p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-secondary">Total:</span>
                    <span className="font-bold text-text-primary">{formatCurrency(payload[0].payload.realValue)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const CategoryComparisonBarChart: React.FC<CategoryComparisonBarChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const categoryTotals: { [category: string]: number } = {};

        data.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                logValue: Math.log10(Math.max(value, 1)),
                realValue: value
            }))
            .sort((a, b) => b.realValue - a.realValue); // Sort by amount descending
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No comparison data available</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Category Comparison</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-secondary)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={2}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickFormatter={(value) => `$${Math.round(Math.pow(10, value)).toLocaleString()}`}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-light)' }} />
                        <Bar dataKey="logValue" radius={[4, 4, 0, 0]} maxBarSize={60}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryComparisonBarChart;
