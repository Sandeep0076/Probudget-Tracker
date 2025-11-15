import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, Category, RecurringTransaction } from '../types';
import TransactionListItem from './TransactionListItem';
import RecurringTransactionListItem from './RecurringTransactionListItem';
import Pagination from './Pagination';
import { PlusCircleIcon } from './icons/ActionIcons';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface TransactionsPageProps {
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    categories: Category[];
    onAddTransactionClick: (type: TransactionType) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => Promise<void>;
}

const TRANSACTIONS_PER_PAGE = 10;

const TypeFilterButton: React.FC<{ onClick: () => void; isActive: boolean, children: React.ReactNode }> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-brand text-white shadow-neu-sm'
                : 'text-text-secondary hover:bg-surface/70'
        }`}
    >
        {children}
    </button>
);

const FilterDropdown: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; placeholder: string }> = ({ value, onChange, children, placeholder }) => (
    <div className="relative">
        <select
            value={value}
            onChange={onChange}
            className="appearance-none w-full md:w-48 pl-4 pr-10 py-2 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
        >
            <option value="all" className="bg-background-end">{placeholder}</option>
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
            <ChevronDownIcon className="w-4 h-4" />
        </div>
    </div>
);


const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions, recurringTransactions, categories, onAddTransactionClick, onEditTransaction, onDeleteTransaction }) => {
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [labelFilter, setLabelFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('this-month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
    const [showRecurring, setShowRecurring] = useState(false);

    const datePopoverRef = useRef<HTMLDivElement>(null);
    const dateButtonRef = useRef<HTMLButtonElement>(null);

    const allLabels = useMemo(() => {
        const labelSet = new Set<string>();
        transactions.forEach(t => {
            if (t.labels) {
                t.labels.forEach(label => labelSet.add(label));
            }
        });
        return Array.from(labelSet).sort();
    }, [transactions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isDatePopoverOpen &&
                datePopoverRef.current && !datePopoverRef.current.contains(event.target as Node) &&
                dateButtonRef.current && !dateButtonRef.current.contains(event.target as Node)
            ) {
                setIsDatePopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDatePopoverOpen]);
    
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Filter by recurring status
            if (showRecurring && !t.recurringTransactionId) return false;
            if (!showRecurring && t.recurringTransactionId) return false;

            const typeMatch = typeFilter === 'all' || t.type === typeFilter;
            const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
            const labelMatch = labelFilter === 'all' || (t.labels && t.labels.includes(labelFilter));

            if (!typeMatch || !categoryMatch || !labelMatch) return false;

            const transactionDate = new Date(t.date);
            const now = new Date();
            let startRange: Date | null = null;
            let endRange: Date | null = null;

            switch (dateFilter) {
                case 'this-month':
                    startRange = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                    endRange = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
                    break;
                case 'last-month':
                    startRange = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
                    endRange = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
                    break;
                case 'this-year':
                    startRange = new Date(Date.UTC(now.getFullYear(), 0, 1));
                    endRange = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999));
                    break;
                case 'custom':
                    if (startDate) startRange = new Date(startDate);
                    if (endDate) {
                        endRange = new Date(endDate);
                        endRange.setUTCHours(23, 59, 59, 999);
                    }
                    break;
            }
            if (startRange && transactionDate < startRange) return false;
            if (endRange && transactionDate > endRange) return false;

            return true;
        });
    }, [transactions, typeFilter, categoryFilter, labelFilter, dateFilter, startDate, endDate, showRecurring]);
    
    const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * TRANSACTIONS_PER_PAGE, currentPage * TRANSACTIONS_PER_PAGE);

    const handleTypeFilterChange = (type: string) => {
        setTypeFilter(type);
        setCategoryFilter('all');
        setCurrentPage(1);
        setShowRecurring(false);
    }

    const handleRecurringToggle = () => {
        setShowRecurring(!showRecurring);
        setTypeFilter('all');
        setCategoryFilter('all');
        setCurrentPage(1);
    }
    
    const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategoryFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleLabelFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLabelFilter(e.target.value);
        setCurrentPage(1);
    };
    
    const handleDateSelect = (filter: string) => {
        setDateFilter(filter);
        setCurrentPage(1);
        if (filter !== 'custom') {
            setStartDate('');
            setEndDate('');
            setIsDatePopoverOpen(false);
        }
    }

    const categoriesForFilter = useMemo(() => {
        if (typeFilter === 'all') return categories;
        return categories.filter(c => c.type === typeFilter);
    }, [categories, typeFilter]);

    const dateFilterOptions: { [key: string]: string } = {
        'all': 'All Time',
        'this-month': 'This Month',
        'last-month': 'Last Month',
        'this-year': 'This Year',
    };

    const getDateButtonText = () => {
        if (dateFilter === 'custom' && startDate && endDate) {
            const start = new Date(startDate).toLocaleDateString('en-CA');
            const end = new Date(endDate).toLocaleDateString('en-CA');
            return `${start} to ${end}`;
        }
        return dateFilterOptions[dateFilter] || 'Select Date';
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-primary">All Transactions</h1>
                <button
                    onClick={() => onAddTransactionClick(TransactionType.EXPENSE)}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                >
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Add Transaction
                </button>
            </div>
            
            {/* --- NEW FILTER BAR --- */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-6">
                <div className="flex items-center bg-surface shadow-inner rounded-lg p-1 space-x-1">
                    <TypeFilterButton onClick={() => handleTypeFilterChange('all')} isActive={typeFilter === 'all' && !showRecurring}>All</TypeFilterButton>
                    <TypeFilterButton onClick={() => handleTypeFilterChange(TransactionType.INCOME)} isActive={typeFilter === TransactionType.INCOME && !showRecurring}>Income</TypeFilterButton>
                    <TypeFilterButton onClick={() => handleTypeFilterChange(TransactionType.EXPENSE)} isActive={typeFilter === TransactionType.EXPENSE && !showRecurring}>Expense</TypeFilterButton>
                    <TypeFilterButton onClick={handleRecurringToggle} isActive={showRecurring}>Recurring</TypeFilterButton>
                </div>
                
                <FilterDropdown value={categoryFilter} onChange={handleCategoryFilterChange} placeholder="All Categories">
                    {categoriesForFilter.map(cat => <option key={cat.id} value={cat.name} className="bg-background-end">{cat.name}</option>)}
                </FilterDropdown>

                <FilterDropdown value={labelFilter} onChange={handleLabelFilterChange} placeholder="All Labels">
                    {allLabels.map(label => <option key={label} value={label} className="bg-background-end">{label}</option>)}
                </FilterDropdown>
                
                <div className="relative">
                    <button
                        ref={dateButtonRef}
                        onClick={() => setIsDatePopoverOpen(!isDatePopoverOpen)}
                        className="flex items-center gap-2 w-full md:w-auto px-4 py-2 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    >
                        <CalendarIcon className="w-5 h-5 text-text-secondary" />
                        <span className="text-sm">{getDateButtonText()}</span>
                        <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                    </button>
                    {isDatePopoverOpen && (
                        <div ref={datePopoverRef} className="absolute top-full mt-2 w-72 bg-surface/80 backdrop-blur-xl p-4 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow z-10">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(dateFilterOptions).map(([key, value]) => (
                                    <button key={key} onClick={() => handleDateSelect(key)} className={`px-3 py-2 text-sm text-left rounded-md transition-colors ${dateFilter === key ? 'bg-brand text-white shadow-neu-sm' : 'hover:bg-surface text-text-secondary'}`}>{value}</button>
                                ))}
                            </div>
                            <button onClick={() => handleDateSelect('custom')} className={`w-full mt-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${dateFilter === 'custom' ? 'bg-brand text-white shadow-neu-sm' : 'hover:bg-surface text-text-secondary'}`}>Custom Range</button>
                            {dateFilter === 'custom' && (
                                <div className="space-y-3 mt-4">
                                    <div>
                                        <label className="text-xs text-text-secondary">Start Date</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-surface rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent shadow-inner border border-border-shadow" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary">End Date</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-surface rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent shadow-inner border border-border-shadow" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-card-bg backdrop-blur-xl p-6 rounded-xl shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
                {showRecurring ? (
                    <>
                        {recurringTransactions.length > 0 || paginatedTransactions.length > 0 ? (
                            <div className="space-y-6">
                                {recurringTransactions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-4">Upcoming Recurring Transactions</h3>
                                        <ul className="space-y-2">
                                            {recurringTransactions.map(tx => <RecurringTransactionListItem key={tx.id} transaction={tx} onDelete={() => {}} />)}
                                        </ul>
                                    </div>
                                )}
                                {paginatedTransactions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-4">Past Recurring Transactions</h3>
                                        <ul>
                                            {paginatedTransactions.map(tx => <TransactionListItem key={tx.id} transaction={tx} onEdit={onEditTransaction} onDelete={onDeleteTransaction} />)}
                                        </ul>
                                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-text-secondary py-16">
                                <p className="text-lg">No recurring transactions found.</p>
                                <p className="mt-2 text-sm">Add a recurring transaction to see it here.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {paginatedTransactions.length > 0 ? (
                            <>
                                <ul>
                                    {paginatedTransactions.map(tx => <TransactionListItem key={tx.id} transaction={tx} onEdit={onEditTransaction} onDelete={onDeleteTransaction} />)}
                                </ul>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </>
                        ) : (
                            <div className="text-center text-text-secondary py-16">
                                <p className="text-lg">No transactions match your filters.</p>
                                <p className="mt-2 text-sm">Try adjusting your search or add a new transaction.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;