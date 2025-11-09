import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b', '#f43f5e', '#38bdf8', '#e11d48', '#fbbf24', '#4ade80', '#c084fc'];

const CustomTooltipContent = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage = total > 0 ? (data.value / total * 100).toFixed(1) : 0;
    return (
      <div 
        className="bg-surface/80 backdrop-blur-sm p-2 rounded-md border border-border-shadow text-sm shadow-neu-lg"
      >
        <p className="font-semibold text-text-primary">{data.name}</p>
        <p style={{ color: data.fill }}>
          {`Amount: ${formatCurrency(data.value as number)} (${percentage}%)`}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: any) => {
    const { payload, categorySpending } = props;
    if (!categorySpending) return null;
    
    return (
      <ul className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4">
        {
          payload.map((entry: any, index: number) => {
            const categoryName = entry.value;
            const amount = categorySpending[categoryName];
            if (amount === undefined) return null;

            return (
                <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-text-secondary">{categoryName}:</span>
                  <span className="text-text-primary font-medium">{formatCurrency(amount)}</span>
                </li>
            );
          })
        }
      </ul>
    );
};

const ExpenseChart: React.FC<{transactions: Transaction[], className?: string}> = ({ transactions, className }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = transactions.filter(
    t => t.type === TransactionType.EXPENSE && 
    new Date(t.date).getMonth() === currentMonth && 
    new Date(t.date).getFullYear() === currentYear
  );

  const totalMonthlyExpenses = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  const categorySpending = monthlyExpenses.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {} as { [key: string]: number });
  
  const sortedCategories = Object.keys(categorySpending).sort((a, b) => categorySpending[b] - categorySpending[a]);

  const chartData = [{
    name: 'Expenses',
    ...categorySpending
  }];
  
  return (
    <div className={`bg-white p-6 rounded-xl shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col justify-between ${className || ''}`}>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Monthly Expense Breakdown</h3>
        <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalMonthlyExpenses)}</p>
      </div>
      
      {sortedCategories.length > 0 ? (
        <div style={{ width: '100%', height: '100px' }}>
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
              barSize={20}
            >
              <XAxis type="number" hide domain={[0, totalMonthlyExpenses]} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                content={<CustomTooltipContent total={totalMonthlyExpenses} />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              />
              <Legend content={<CustomLegend categorySpending={categorySpending} />} />
              {sortedCategories.map((category, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedCategories.length - 1;
                let radius: [number, number, number, number] = [0, 0, 0, 0];
                
                if (sortedCategories.length === 1) {
                    radius = [8, 8, 8, 8];
                } else if (isFirst) {
                    radius = [8, 0, 0, 8];
                } else if (isLast) {
                    radius = [0, 8, 8, 0];
                }
                
                return (
                    <Bar
                        key={category}
                        dataKey={category}
                        name={category}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                        radius={radius}
                    />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-center text-text-secondary min-h-[100px]">
          <p>No expenses this month to display.</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseChart;
