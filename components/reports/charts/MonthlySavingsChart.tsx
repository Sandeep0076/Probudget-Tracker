import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Saving, Transaction, TransactionType } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface MonthlySavingsChartProps {
    data: Saving[];
    transactions: Transaction[];
}

interface SavingsChartData {
    month: string;
    savings: number;
    transfers: number;
    stocks: number;
    total: number;
    fullDate: string;
    transferCategories: string[];
    stockCategories: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-surface/90 backdrop-blur-md p-3 rounded-lg border border-border-highlight shadow-neu-lg min-w-[150px]">
                <p className="text-text-primary font-semibold mb-2">{label}</p>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                            <span className="text-text-secondary">Savings</span>
                        </div>
                        <span className="font-medium text-text-primary">{formatCurrency(data.savings)}</span>
                    </div>
                    {(data.transfers > 0 || data.stocks > 0) && (
                        <>
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                                    <span className="text-text-secondary">Transfers</span>
                                </div>
                                <span className="font-medium text-text-primary">{formatCurrency(data.transfers)}</span>
                            </div>
                            {data.transferCategories.length > 0 && (
                                <div className="pl-3.5 text-[10px] text-text-muted mb-1">
                                    {data.transferCategories.slice(0, 3).join(', ')}{data.transferCategories.length > 3 ? '...' : ''}
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
                                    <span className="text-text-secondary">Stocks</span>
                                </div>
                                <span className="font-medium text-text-primary">{formatCurrency(data.stocks)}</span>
                            </div>
                            {data.stockCategories.length > 0 && (
                                <div className="pl-3.5 text-[10px] text-text-muted mb-1">
                                    {data.stockCategories.slice(0, 3).join(', ')}{data.stockCategories.length > 3 ? '...' : ''}
                                </div>
                            )}
                            <div className="pt-2 mt-1 border-t border-border-highlight flex justify-between items-center text-sm font-bold">
                                <span className="text-text-primary">Total</span>
                                <span className="text-text-primary">{formatCurrency(data.total)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({ data, transactions }) => {
    const [viewMode, setViewMode] = React.useState<'savings' | 'total'>('savings');

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
            const manualSavings = savingForMonth?.amount || 0;
            let transfers = 0;
            let stocks = 0;
            const transferCats: Set<string> = new Set();
            const stockCats: Set<string> = new Set();

            if (viewMode === 'total') {
                // Add transactions from specific categories
                const monthTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === date.getFullYear() &&
                        tDate.getMonth() === date.getMonth() &&
                        t.type === TransactionType.EXPENSE;
                });





                monthTransactions.forEach(t => {
                    const category = (t.category || '').toLowerCase().trim();

                    if (category === 'transfer home' ||
                        category === 'transfer to wify' ||
                        category === 'transfer to wife' ||
                        category === 'transfer to wifey') {
                        transfers += t.amount;
                        transferCats.add(t.category);
                    } else if (category.includes('stock') ||
                        category.includes('invest') ||
                        category.includes('etf') ||
                        category.includes('fund') ||
                        category.includes('trading') ||
                        category === 'shares') {
                        stocks += t.amount;
                        stockCats.add(t.category);
                    }
                });
            }

            months.push({
                month: monthName,
                savings: manualSavings,
                transfers: transfers,
                stocks: stocks,
                total: manualSavings + transfers + stocks,
                fullDate: monthKey,
                transferCategories: Array.from(transferCats),
                stockCategories: Array.from(stockCats)
            });
        }

        console.log('[MonthlySavingsChart] Chart data generated:', months);
        return months;
    }, [data, transactions, viewMode]);

    if (chartData.length === 0) {
        console.log('[MonthlySavingsChart] No data to display');
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No savings data available</p>
            </div>
        );
    }

    // Find min and max for domain calculation
    const amounts = chartData.map(d => d.total);
    const maxAmount = Math.max(...amounts, 0);
    const minAmount = Math.min(...amounts, 0);
    const domain = [Math.floor(minAmount * 1.1), Math.ceil(maxAmount * 1.1)];

    console.log('[MonthlySavingsChart] Y-axis domain:', domain);

    return (
        <div className="h-full w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Monthly Savings</h3>
                    <p className="text-sm text-text-secondary">
                        {viewMode === 'savings'
                            ? 'Manual savings entries only'
                            : 'Includes transfers and investments'}
                    </p>
                </div>

                <div className="flex bg-surface/50 p-1 rounded-lg border border-border-highlight">
                    <button
                        onClick={() => setViewMode('savings')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'savings'
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                            }`}
                    >
                        Savings Only
                    </button>
                    <button
                        onClick={() => setViewMode('total')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === 'total'
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                            }`}
                    >
                        Total (Incl. Transfers)
                    </button>
                </div>
            </div>
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
                        <Bar dataKey="savings" stackId="a" fill="#10B981" radius={[4, 4, 4, 4]} maxBarSize={60} />
                        <Bar dataKey="transfers" stackId="a" fill="#3B82F6" radius={[4, 4, 4, 4]} maxBarSize={60} />
                        <Bar dataKey="stocks" stackId="a" fill="#8B5CF6" radius={[4, 4, 4, 4]} maxBarSize={60} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlySavingsChart;