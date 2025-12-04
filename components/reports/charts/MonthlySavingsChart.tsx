import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Saving } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface MonthlySavingsChartProps {
    data: Saving[];
}

interface SavingsChartData {
    month: string;
    amount: number;
    fullDate: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const amount = payload[0].value;
        const status = amount > 0 ? 'Saved' : amount < 0 ? 'Borrowed' : 'Break-even';
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-primary font-semibold mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-text-secondary text-xs">
                        <span className="font-medium">Status:</span> <span className={amount > 0 ? 'text-success' : amount < 0 ? 'text-danger' : 'text-text-secondary'}>{status}</span>
                    </p>
                    <p className="text-text-secondary text-xs">
                        <span className="font-medium">Amount:</span> <span className="font-bold text-text-primary">{formatCurrency(Math.abs(amount))}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        console.log('[MonthlySavingsChart] Processing savings data, total records:', data.length);
        
        // Get the last 6 months
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        console.log('[MonthlySavingsChart] Date range:', {
            from: sixMonthsAgo.toISOString(),
            to: now.toISOString()
        });
        
        // Create array of last 6 months
        const months: SavingsChartData[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            
            // Find savings for this month
            const savingForMonth = data.find(s => s.year === date.getFullYear() && s.month === date.getMonth());
            
            months.push({
                month: monthName,
                amount: savingForMonth?.amount || 0,
                fullDate: monthKey
            });
        }
        
        console.log('[MonthlySavingsChart] Chart data generated:', months);
        return months;
    }, [data]);

    if (chartData.length === 0) {
        console.log('[MonthlySavingsChart] No data to display');
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No savings data available</p>
            </div>
        );
    }

    // Find min and max for domain calculation
    const amounts = chartData.map(d => d.amount);
    const maxAmount = Math.max(...amounts, 0);
    const minAmount = Math.min(...amounts, 0);
    const domain = [Math.floor(minAmount * 1.1), Math.ceil(maxAmount * 1.1)];

    console.log('[MonthlySavingsChart] Y-axis domain:', domain);

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Savings</h3>
            <p className="text-sm text-text-secondary mb-4">
                Positive values indicate savings, negative values show borrowing or deficits
            </p>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickFormatter={(value) => formatCurrency(value)}
                            tickLine={false}
                            axisLine={false}
                            domain={domain}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-light)' }} />
                        <ReferenceLine y={0} stroke="var(--color-text-primary)" strokeWidth={2} />
                        <Bar dataKey="amount" radius={[4, 4, 4, 4]} maxBarSize={60}>
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                        entry.amount > 0 
                                            ? 'var(--color-success)' 
                                            : entry.amount < 0 
                                            ? 'var(--color-danger)' 
                                            : 'var(--color-text-muted)'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlySavingsChart;