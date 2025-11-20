import React, { useMemo } from 'react';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface TopExpensesTableProps {
    data: Transaction[];
}

const TopExpensesTable: React.FC<TopExpensesTableProps> = ({ data }) => {
    const topExpenses = useMemo(() => {
        return [...data]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);
    }, [data]);

    if (topExpenses.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/30 rounded-xl border border-dashed border-text-muted">
                <p className="text-text-muted">No expenses found</p>
            </div>
        );
    }

    const maxAmount = topExpenses[0]?.amount || 1;

    return (
        <div className="bg-card-bg backdrop-blur-xl p-6 rounded-2xl shadow-neu-3d border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Expenses</h3>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <div className="space-y-3">
                    {topExpenses.map((t) => (
                        <div key={t.id} className="relative group">
                            {/* Background Bar */}
                            <div
                                className="absolute inset-0 bg-surface-light rounded-lg opacity-20 transition-all duration-500"
                                style={{ width: `${(t.amount / maxAmount) * 100}%` }}
                            ></div>

                            <div className="relative flex items-center justify-between p-3 rounded-lg hover:bg-surface/30 transition-colors">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-text-primary truncate">{t.description}</span>
                                    <span className="text-xs text-text-secondary">{new Date(t.date).toLocaleDateString()} • {t.category}</span>
                                </div>
                                <span className="font-bold text-text-primary whitespace-nowrap ml-4">
                                    {formatCurrency(t.amount)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TopExpensesTable;
