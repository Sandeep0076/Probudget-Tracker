import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, affectsBudget: boolean) => void;
    category: Category | null;
    existingCategoryNames: string[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit, category, existingCategoryNames }) => {
    const [name, setName] = useState('');
    const [affectsBudget, setAffectsBudget] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setName(category.name);
            setAffectsBudget(category.affectsBudget !== false);
        } else {
            setName('');
            setAffectsBudget(true);
        }
        setError('');
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name cannot be empty.');
            return;
        }

        const isDuplicate = existingCategoryNames
            .filter(existingName => existingName.toLowerCase() !== category?.name.toLowerCase())
            .includes(trimmedName.toLowerCase());

        if (isDuplicate) {
            setError('This category name already exists.');
            return;
        }

        onSubmit(trimmedName, affectsBudget);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface backdrop-blur-xl p-8 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
                    {category ? 'Edit Category' : 'Add New Category'}
                </h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="category-name" className="block text-sm font-medium text-text-secondary mb-1">Category Name</label>
                        <input
                            type="text"
                            id="category-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                            required
                        />
                        {error && <p className="text-danger text-sm mt-2">{error}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="affects-budget"
                            checked={affectsBudget}
                            onChange={(e) => setAffectsBudget(e.target.checked)}
                            className="w-4 h-4 text-brand bg-surface border-border-shadow rounded focus:ring-accent"
                        />
                        <label htmlFor="affects-budget" className="text-sm font-medium text-text-secondary">
                            Affects Budget (Include in expense totals)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                        >
                            Save Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;