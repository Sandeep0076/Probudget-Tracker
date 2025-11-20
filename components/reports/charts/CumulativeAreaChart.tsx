import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface CumulativeAreaChartProps {
    data: Transaction[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-secondary text-xs mb-1">{label}</p>
                <p className="text-brand font-bold">{formatCurrency(payload[0].payload.realValue)}</p>
            </div>
        );
    }
    return null;
};

const CumulativeAreaChart: React.FC<CumulativeAreaChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let cumulativeTotal = 0;
        const dailyCumulative: { [date: string]: number } = {};

        sortedData.forEach(t => {
            cumulativeTotal += t.amount;
            const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyCumulative[dateKey] = cumulativeTotal;
        });

        return Object.entries(dailyCumulative).map(([name, value]) => ({
            name,
            value: Math.max(value, 1),
            realValue: value
        }));
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No data available</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Cumulative Spending</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-shadow)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            scale="log"
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-text-muted)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <Area
                            type="linear"
                            dataKey="value"
                            stroke="var(--color-accent)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCumulative)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CumulativeAreaChart;
