import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

import { Category } from '../../../types';

interface PeriodComparisonViewProps {
    data: Transaction[];
    categories: Category[];
    includeExcluded?: boolean;
}

const COLORS = ['#0ea5e9', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-primary font-semibold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => {
                    const realValue = entry.name === "This Month" ? entry.payload.realThisMonth : entry.payload.realLastMonth;
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                            <span className="text-text-secondary">{entry.name}:</span>
                            <span className="font-bold text-text-primary">{formatCurrency(realValue)}</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const PeriodComparisonView: React.FC<PeriodComparisonViewProps> = ({ data, categories, includeExcluded = false }) => {
    const chartData = useMemo(() => {
        // Compare This Month vs Last Month by Category
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const categoryMap = categories.reduce((acc, c) => {
            acc[c.name] = c.affectsBudget !== false;
            return acc;
        }, {} as Record<string, boolean>);

        const thisMonthData: { [category: string]: number } = {};
        const lastMonthData: { [category: string]: number } = {};
        const allCategories = new Set<string>();

        data.forEach(t => {
            if (!includeExcluded && categoryMap[t.category] === false) return; // Skip excluded categories if not in total mode

            const tDate = new Date(t.date);
            if (tDate >= thisMonthStart) {
                thisMonthData[t.category] = (thisMonthData[t.category] || 0) + t.amount;
                allCategories.add(t.category);
            } else if (tDate >= lastMonthStart && tDate <= lastMonthEnd) {
                lastMonthData[t.category] = (lastMonthData[t.category] || 0) + t.amount;
                allCategories.add(t.category);
            }
        });

        return Array.from(allCategories).map(cat => ({
            name: cat,
            logThisMonth: Math.log10(Math.max(thisMonthData[cat] || 0, 1)),
            logLastMonth: Math.log10(Math.max(lastMonthData[cat] || 0, 1)),
            realThisMonth: thisMonthData[cat] || 0,
            realLastMonth: lastMonthData[cat] || 0
        })).sort((a, b) => (b.realThisMonth + b.realLastMonth) - (a.realThisMonth + a.realLastMonth));
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
            <h3 className="text-lg font-semibold text-text-primary mb-4">Month vs Month Comparison</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
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
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', color: 'var(--color-text-secondary)' }}
                            iconType="circle"
                        />
                        <Bar dataKey="logLastMonth" name="Last Month" fill={COLORS[1]} radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="logThisMonth" name="This Month" fill={COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PeriodComparisonView;
