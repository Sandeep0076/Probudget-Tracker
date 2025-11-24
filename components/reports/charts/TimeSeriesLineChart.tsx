import React, { useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface TimeSeriesLineChartProps {
    data: Transaction[];
    range: string;
}

interface SpendingCandlestickData {
    name: string;
    high: number;      // Maximum single transaction amount
    total: number;      // Total spending for the day
    low: number;       // Always 0 for spending
    logHigh: number;    // Log10 of high
    logTotal: number;   // Log10 of total
}

// Separate tooltip component for spending trend
const SpendingTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as SpendingCandlestickData;
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg">
                <p className="text-text-secondary text-xs mb-2 font-semibold">{label}</p>
                <div className="space-y-1">
                    <p className="text-text-secondary text-xs">
                        <span className="font-medium">High:</span> <span className="text-brand">{formatCurrency(data.high)}</span>
                    </p>
                    <p className="text-text-secondary text-xs">
                        <span className="font-medium">Total:</span> <span className="text-brand font-bold">{formatCurrency(data.total)}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// Custom candlestick shape function for Recharts Bar
const CandlestickShape = (props: any) => {
    const { x, y, width, height, payload } = props;
    const { logHigh, logTotal, high, total } = payload as SpendingCandlestickData;

    if (total <= 1 && high <= 1) {
        return null;
    }

    const candleColor = 'var(--color-brand)';
    const wickColor = 'var(--color-text-secondary)';
    const candleWidth = Math.max(width * 0.5, 12);
    const candleX = x + (width - candleWidth) / 2;

    // Calculate wick position based on log values
    const chartHeight = props.yAxis?.height || 0;
    const domainMax = props.yAxis?.domain?.[1] || 1;
    const domainMin = props.yAxis?.domain?.[0] || 0;
    const domainRange = domainMax - domainMin;

    const pixelScale = domainRange > 0 ? chartHeight / domainRange : 0;

    // Calculate the additional height needed for the wick (difference in log values)
    const logDiff = Math.max(0, logHigh - logTotal);
    const wickPixelHeight = logDiff * pixelScale;
    const wickTopY = y - wickPixelHeight;

    return (
        <g>
            {/* High wick - vertical line above candle when high > total */}
            {logHigh > logTotal && wickPixelHeight > 0 && (
                <line
                    x1={x + width / 2}
                    y1={y}
                    x2={x + width / 2}
                    y2={wickTopY}
                    stroke={wickColor}
                    strokeWidth={1.5}
                    opacity={0.7}
                />
            )}
            {/* Candle body - rectangle showing total spending */}
            {height > 0 && (
                <rect
                    x={candleX}
                    y={y}
                    width={candleWidth}
                    height={height}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth={1}
                    rx={2}
                />
            )}
        </g>
    );
};

const TimeSeriesLineChart: React.FC<TimeSeriesLineChartProps> = ({ data, range }) => {
    // Separate calculation logic for spending trend (completely independent from cumulative)
    const { chartData, yAxisDomain, ticks } = useMemo(() => {
        const dailySpending: { [key: string]: { transactions: number[], total: number } } = {};

        // Sort transactions by date
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (sortedData.length === 0) return { chartData: [], yAxisDomain: [0, 1], ticks: [0, 1] };

        // Determine grouping based on range
        const isMonthly = range === 'last-6-months' || range === 'this-year';

        // Group transactions by date - separate logic for spending trend
        sortedData.forEach(t => {
            const date = new Date(t.date);
            let key = '';

            if (isMonthly) {
                key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            } else {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (!dailySpending[key]) {
                dailySpending[key] = { transactions: [], total: 0 };
            }
            dailySpending[key].transactions.push(t.amount);
            dailySpending[key].total += t.amount;
        });

        // Create candlestick data points - separate calculation
        const dataPoints: SpendingCandlestickData[] = Object.entries(dailySpending)
            .map(([name, dayData]) => {
                const amounts = dayData.transactions;
                const high = amounts.length > 0 ? Math.max(...amounts) : 0;
                const total = dayData.total;

                return {
                    name,
                    high,
                    total,
                    low: 0, // Always 0 for spending
                    logHigh: high > 1 ? Math.log10(high) : 0,
                    logTotal: total > 1 ? Math.log10(total) : 0
                };
            })
            .sort((a, b) => {
                // Sort by date for proper ordering
                try {
                    const dateA = new Date(a.name);
                    const dateB = new Date(b.name);
                    return dateA.getTime() - dateB.getTime();
                } catch {
                    return a.name.localeCompare(b.name);
                }
            });

        // Calculate Y-axis domain separately for spending trend
        const allSpendingValues = dataPoints.flatMap(d => [d.high, d.total]).filter(v => v > 0);
        const maxSpendingValue = allSpendingValues.length > 0 ? Math.max(...allSpendingValues) : 100;

        // Log scale calculations
        const maxLog = Math.ceil(Math.log10(Math.max(maxSpendingValue, 10))); // Ensure at least up to 10
        const ticks = Array.from({ length: maxLog + 1 }, (_, i) => i); // [0, 1, 2, ... maxLog]

        return {
            chartData: dataPoints,
            yAxisDomain: [0, maxLog],
            ticks
        };
    }, [data, range]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No trend data available</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Spending Trend</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
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
                            domain={yAxisDomain}
                            ticks={ticks}
                            stroke="var(--color-text-secondary)"
                            fontSize={12}
                            tickFormatter={(value) => formatCurrency(Math.pow(10, value))}
                            tickLine={false}
                            axisLine={false}
                            width={80}
                        />
                        <Tooltip content={<SpendingTrendTooltip />} cursor={{ stroke: 'var(--color-text-muted)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                        <ReferenceLine y={0} stroke="var(--color-border-shadow)" />
                        <Bar
                            dataKey="logTotal"
                            fill="var(--color-brand)"
                            shape={<CandlestickShape />}
                            barSize={20}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TimeSeriesLineChart;
