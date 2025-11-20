import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { GroceriesIcon, IncomeSalaryIcon, TransportIcon, UtilitiesIcon, EntertainmentIcon, HealthIcon, RentIcon } from './icons/CategoryIcons';
import { ShoppingIcon, FoodIcon, TravelIcon, HomeIcon, CarIcon, PetsIcon, GiftsIcon, EducationIcon, FitnessIcon, OtherIcon } from './icons/NewCategoryIcons';
import { RecurringIcon } from './icons/RecurringIcon';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { formatCurrency } from '../utils/formatters';

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
    'Rent': <RentIcon />,
    'House Rent': <RentIcon />,
    'Shopping': <ShoppingIcon />,
    'Food': <FoodIcon />,
    'Travel': <TravelIcon />,
    'Home': <HomeIcon />,
    'Car': <CarIcon />,
    'Pets': <PetsIcon />,
    'Gifts': <GiftsIcon />,
    'Education': <EducationIcon />,
    'Fitness': <FitnessIcon />,
    'Other': <OtherIcon />
}

const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || <OtherIcon />;
};

interface TransactionListItemProps {
    transaction: Transaction;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transactionId: string) => Promise<void>;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({ transaction, onEdit, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const isIncome = transaction.type === TransactionType.INCOME;
    const amountColor = isIncome ? 'text-success' : 'text-text-primary';
    const amountPrefix = isIncome ? '+' : '-';
    
    const formattedDate = new Date(transaction.date + 'T00:00:00.000Z').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMenuOpen &&
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleDelete = async () => {
        setIsMenuOpen(false);
        if (window.confirm(`Are you sure you want to delete this transaction: "${transaction.description}"?`)) {
            try {
                await onDelete(transaction.id);
            } catch (error) {
                console.error("Deletion failed from transaction list item:", error);
                // The main error alert is in App.tsx, this is a fallback.
                alert("An error occurred while trying to delete the transaction.");
            }
        }
    };
    
    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit(transaction);
    };
    
    return (
        <li className="flex items-center justify-between py-4 border-b border-border-shadow last:border-b-0">
            <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-surface shadow-inner text-accent">
                    {getCategoryIcon(transaction.category)}
                </div>
                <div className="ml-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">
                            {transaction.description}
                            {transaction.quantity > 1 && <span className="text-text-muted font-normal text-xs ml-1.5">x{transaction.quantity}</span>}
                        </p>
                        {transaction.recurringTransactionId && (
                            <span title="Recurring Transaction">
                                <RecurringIcon className="w-4 h-4 text-text-muted" />
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-text-secondary">{formattedDate}</p>
                    {transaction.labels && transaction.labels.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {transaction.labels.map(label => (
                                <span key={label} className="label-chip">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className={`sm:hidden text-sm font-semibold mt-2 ${amountColor}`}>
                        {amountPrefix} {formatCurrency(transaction.amount)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className={`text-sm font-semibold ${amountColor} hidden sm:block`}>
                    {amountPrefix} {formatCurrency(transaction.amount)}
                </p>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full text-text-secondary hover:bg-surface/70 hover:text-text-primary transition-colors"
                        aria-label="Transaction options"
                    >
                        <DotsVerticalIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute top-full right-0 mt-2 w-32 bg-white p-2 rounded-lg shadow-neu-3d border border-gray-200 z-10"
                        >
                            <button
                                onClick={handleEdit}
                                className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-800 hover:bg-gray-100 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-3 py-2 text-sm rounded-md text-danger hover:bg-red-50 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

export default TransactionListItem;