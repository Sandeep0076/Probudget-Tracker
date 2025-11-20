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
                <p className="text-brand font-bold">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

const CumulativeAreaChart: React.FC<CumulativeAreaChartProps> = ({ data }) => {
    const { chartData, yAxisDomain } = useMemo(() => {
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (sortedData.length === 0) return { chartData: [], yAxisDomain: [0, 100] };

        let cumulativeTotal = 0;
        const dailyCumulative: { [date: string]: number } = {};

        sortedData.forEach(t => {
            cumulativeTotal += t.amount;
            const dateKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyCumulative[dateKey] = cumulativeTotal;
        });

        const dataPoints = Object.entries(dailyCumulative).map(([name, value]) => ({
            name,
            value: value
        }));

        // Calculate min and max cumulative values for proper Y-axis scaling
        const values = dataPoints.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        // For cumulative charts, adjust domain to show growth variations better
        let domainMin = 0;
        let domainMax = maxValue;
        
        if (maxValue > 0 && minValue >= 0) {
            const range = maxValue - minValue;
            // If there's significant growth, adjust domain to show variations
            if (range > 0 && maxValue / Math.max(minValue, 1) > 1.1) {
                // Start from a value closer to min to show growth better
                // But still show 0 if min is close to 0
                domainMin = minValue > maxValue * 0.1 ? minValue * 0.95 : 0;
            }
            // Add padding for better visualization
            const padding = range > 0 ? range * 0.1 : maxValue * 0.1;
            domainMax = maxValue + padding;
        }

        return {
            chartData: dataPoints,
            yAxisDomain: [domainMin, domainMax]
        };
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
                            domain={yAxisDomain}
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickFormatter={(value) => formatCurrency(value)}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
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
