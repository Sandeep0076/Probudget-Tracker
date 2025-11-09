
import React from 'react';
import { PlusCircleIcon, DocumentAddIcon } from './icons/ActionIcons';
import { TransactionType } from '../types';

interface QuickActionsProps {
  onAddTransactionClick: (type: TransactionType) => void;
  onNavigate: (page: 'budgets') => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddTransactionClick, onNavigate }) => {
  return (
    <div className="bg-white/20 backdrop-blur-xl p-6 rounded-xl border-t border-l border-white/40 border-b border-r border-black/20 mt-8">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button 
          onClick={() => onAddTransactionClick(TransactionType.EXPENSE)}
          className="w-full flex items-center justify-center px-4 py-3 border border-sky-500 border-t-sky-300 border-b-sky-700 border-l-sky-300 border-r-sky-700 text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue/90 hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Expense
        </button>
        <button 
          onClick={() => onAddTransactionClick(TransactionType.INCOME)}
          className="w-full flex items-center justify-center px-4 py-3 border-t border-l border-white/40 border-b border-r border-black/20 text-sm font-medium rounded-md text-slate-100 bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Income
        </button>
        <button 
          onClick={() => onNavigate('budgets')}
          className="w-full flex items-center justify-center px-4 py-3 border-t border-l border-white/40 border-b border-r border-black/20 text-sm font-medium rounded-md text-slate-100 bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors">
          <DocumentAddIcon className="w-5 h-5 mr-2" />
          Manage Budgets
        </button>
      </div>
    </div>
  );
};

export default QuickActions;