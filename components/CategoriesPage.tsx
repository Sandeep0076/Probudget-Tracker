import React, { useState } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import CategoryModal from './CategoryModal';
import { PlusCircleIcon } from './icons/ActionIcons';

interface CategoriesPageProps {
    categories: Category[];
    transactions: Transaction[];
    onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
    onUpdateCategory: (id: string, newName: string, oldName: string) => void;
    onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<{
    title: string;
    type: TransactionType;
    categories: Category[];
    transactions: Transaction[];
    onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
    onUpdateCategory: (id: string, newName: string, oldName: string) => void;
    onDeleteCategory: (id: string) => void;
}> = ({ title, type, categories, transactions, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleAddClick = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };
    
    const handleDeleteClick = (category: Category) => {
        const isUsed = transactions.some(t => t.category === category.name);
        if (isUsed) {
            alert(`Cannot delete category "${category.name}" as it is currently used in one or more transactions.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
            onDeleteCategory(category.id);
        }
    };
    
    const handleModalSubmit = (name: string) => {
        if (editingCategory) {
            onUpdateCategory(editingCategory.id, name, editingCategory.name);
        } else {
            onAddCategory({ name, type });
        }
    };

    return (
        <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                <button 
                    onClick={handleAddClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Add New
                </button>
            </div>
            <ul className="space-y-3">
                {categories.map(cat => (
                    <li key={cat.id} className="flex items-center justify-between p-3 bg-surface rounded-lg shadow-inner">
                        <div className="flex items-center gap-3">
                           <span className="text-text-primary">{cat.name}</span>
                           {cat.isDefault && <span className="text-xs font-medium text-text-secondary bg-surface shadow-neu-sm px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleEditClick(cat)} className="text-sm font-medium text-accent hover:text-accent/[0.8]">Edit</button>
                            <button 
                                onClick={() => handleDeleteClick(cat)} 
                                disabled={cat.isDefault}
                                className="text-sm font-medium text-danger hover:text-danger/[0.8] disabled:text-text-muted disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
                 {categories.length === 0 && <p className="text-text-secondary text-center py-4">No categories defined.</p>}
            </ul>
             {isModalOpen && (
                <CategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    category={editingCategory}
                    existingCategoryNames={categories.map(c => c.name)}
                />
            )}
        </div>
    );
};


const CategoriesPage: React.FC<CategoriesPageProps> = (props) => {
    const { categories, ...restProps } = props;
    const incomeCategories = categories.filter(c => c.type === TransactionType.INCOME);
    const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Categories</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CategoryManager title="Expense Categories" type={TransactionType.EXPENSE} categories={expenseCategories} {...restProps} />
                <CategoryManager title="Income Categories" type={TransactionType.INCOME} categories={incomeCategories} {...restProps} />
            </div>
        </div>
    );
};

export default CategoriesPage;