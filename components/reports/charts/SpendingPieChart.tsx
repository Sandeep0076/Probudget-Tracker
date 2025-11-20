import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface SpendingPieChartProps {
    data: Transaction[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b', '#f43f5e', '#38bdf8', '#e11d48', '#fbbf24', '#4ade80', '#c084fc'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-primary font-semibold mb-1">{payload[0].name}</p>
                <p className="text-brand font-bold">{formatCurrency(payload[0].value)}</p>
                <p className="text-text-secondary text-xs">{(payload[0].payload.percent * 100).toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const categoryTotals: { [key: string]: number } = {};
        let total = 0;

        data.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            total += t.amount;
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({
                name,
                value,
                percent: value / total
            }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No data available</p>
            </div>
        );
    }

    return (
        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Spending by Category</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    className="drop-shadow-md hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{
                                paddingLeft: '20px',
                                fontSize: '12px',
                                color: 'var(--color-text-secondary)'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SpendingPieChart;
