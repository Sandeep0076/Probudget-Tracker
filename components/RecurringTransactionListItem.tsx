import React from 'react';
import { RecurringTransaction, TransactionType } from '../types';
import { GroceriesIcon, IncomeSalaryIcon, TransportIcon, UtilitiesIcon, EntertainmentIcon, HealthIcon } from './icons/CategoryIcons';
import { CloseIcon } from './icons/CloseIcon';

const categoryIcons: { [key:string]: React.ReactNode } = {
    'Salary': <IncomeSalaryIcon />,
    'Freelance': <IncomeSalaryIcon />,
    'Bonus': <IncomeSalaryIcon />,
    'Investment': <IncomeSalaryIcon />,
    'Groceries': <GroceriesIcon />,
    'Utilities': <UtilitiesIcon />,
    'Transport': <TransportIcon />,
    'Entertainment': <EntertainmentIcon />,
    'Health': <HealthIcon />,
    'Other': <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 text-xs font-mono">...</div>,
    'Default': <div className="w-10 h-10 rounded-full bg-white/10"></div>
}

interface RecurringTransactionListItemProps {
    transaction: RecurringTransaction;
    onDelete: (id: string) => void;
}

const RecurringTransactionListItem: React.FC<RecurringTransactionListItemProps> = ({ transaction, onDelete }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const amountColor = isIncome ? 'text-green-400' : 'text-slate-200';
    
    const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the recurring transaction "${transaction.description}"? This will not affect any past transactions already created.`)) {
            onDelete(transaction.id);
        }
    };
    
    return (
        <li className="flex items-center justify-between py-4 border-b border-black/20 last:border-b-0">
            <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-sky-300">
                    {categoryIcons[transaction.category] || categoryIcons['Default']}
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-slate-100">{transaction.description}</p>
                    <p className="text-sm text-slate-300">
                        Monthly, on the {transaction.dayOfMonth}{getOrdinalSuffix(transaction.dayOfMonth)}
                    </p>
                    {transaction.labels && transaction.labels.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {transaction.labels.map(label => (
                                <span key={label} className="label-chip">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className={`text-sm font-semibold ${amountColor}`}>
                    ${transaction.amount.toFixed(2)}
                </p>
                <button 
                    onClick={handleDelete}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                    aria-label={`Delete recurring transaction: ${transaction.description}`}
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
}

export default RecurringTransactionListItem;
