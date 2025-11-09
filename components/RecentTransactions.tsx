
import React from 'react';
import { Transaction } from '../types';
import TransactionListItem from './TransactionListItem';
import { Page } from '../App';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onNavigate: (page: Page) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => Promise<void>;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onNavigate, onEditTransaction, onDeleteTransaction }) => {
  return (
    <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-full">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Transactions</h3>
      {transactions.length > 0 ? (
        <ul>
          {transactions.slice(0, 5).map(tx => (
            <TransactionListItem 
                key={tx.id} 
                transaction={tx} 
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center text-text-secondary py-8">
          <p>No transactions yet.</p>
          <p className="text-sm">Add an expense or income to get started!</p>
        </div>
      )}
      {transactions.length > 5 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => onNavigate('transactions')}
            className="text-sm font-medium text-accent hover:text-accent/[0.8] transition-colors"
          >
              View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;