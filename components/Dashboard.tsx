
import React from 'react';
import RecentTransactions from './RecentTransactions';
import ExpenseChart from './ExpenseChart';
import BudgetSummaryCard from './BudgetSummaryCard';
import { Transaction, TransactionType, Budget } from '../types';
import { Page } from '../App';

interface DashboardProps {
  transactions: Transaction[];
  onNavigate: (page: Page) => void;
  overallBudget: Budget | null;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onNavigate, overallBudget, onEditTransaction, onDeleteTransaction }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);
  
  console.log('[Dashboard] Monthly expenses (raw from DB):', monthlyExpenses);
  console.log('[Dashboard] Overall budget (raw from DB):', overallBudget?.amount);
  console.log('[Dashboard] Sample transaction amounts:', transactions.slice(0, 3).map(t => ({ desc: t.description, amount: t.amount })));

  return (
    <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back Mr and Mrs Pathania.</h1>
        <p className="text-text-secondary">Here's your financial overview for this month.</p>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <BudgetSummaryCard 
          className="lg:col-span-2"
          budget={overallBudget}
          totalSpent={monthlyExpenses}
          onSetBudget={() => onNavigate('budgets')}
        />
        <ExpenseChart className="lg:col-span-3" transactions={transactions} />
      </div>

      {/* Main Content Area */}
      <div className="mt-8 grid grid-cols-1 gap-8">
        <RecentTransactions 
            transactions={transactions} 
            onNavigate={onNavigate} 
            onEditTransaction={onEditTransaction} 
            onDeleteTransaction={onDeleteTransaction} 
        />
      </div>
    </div>
  );
};

export default Dashboard;