import React, { useState } from 'react';
import { TransactionFormData, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface ReceiptItemEditorProps {
    item: TransactionFormData;
    categories: Category[];
    onChange: (item: TransactionFormData) => void;
    onRemove: () => void;
}

const ReceiptItemEditor: React.FC<ReceiptItemEditorProps> = ({ item, categories, onChange, onRemove }) => {
    const [labelInput, setLabelInput] = useState('');

    const handleChange = (field: keyof TransactionFormData, value: any) => {
        onChange({ ...item, [field]: value });
    };

    const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newLabel = labelInput.trim().toLowerCase();
            if (newLabel && !item.labels.includes(newLabel)) {
                handleChange('labels', [...item.labels, newLabel]);
            }
            setLabelInput('');
        }
    };
    
    const removeLabel = (labelToRemove: string) => {
        handleChange('labels', item.labels.filter(label => label !== labelToRemove));
    };
    
    const commonInputClasses = "w-full px-3 py-2 bg-surface border border-border-shadow shadow-inner rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent text-sm transition-colors";

    return (
        <div className="bg-surface p-4 rounded-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow relative group">
             <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-danger/80 text-white hover:bg-danger opacity-0 group-hover:opacity-100 transition-opacity shadow-neu-sm"
                aria-label="Remove item"
             >
                <CloseIcon className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Description */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
                    <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className={commonInputClasses}
                    />
                </div>
                {/* Amount */}
                <div>
                     <label className="block text-xs font-medium text-text-secondary mb-1">Amount</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-text-muted text-sm">€</span>
                        </div>
                        <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                            className={`${commonInputClasses} pl-7`}
                            step="0.01"
                        />
                    </div>
                </div>
                {/* Quantity */}
                <div>
                     <label className="block text-xs font-medium text-text-secondary mb-1">Quantity</label>
                     <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                        className={commonInputClasses}
                        step="1"
                        min="1"
                    />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Category */}
                <div>
                     <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
                     <select value={item.category} onChange={(e) => handleChange('category', e.target.value)} className={commonInputClasses}>
                        {categories.map(cat => <option key={cat.id} value={cat.name} className="bg-background-end">{cat.name}</option>)}
                     </select>
                </div>
                {/* Date */}
                <div>
                     <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                     <input type="date" value={item.date} onChange={(e) => handleChange('date', e.target.value)} className={commonInputClasses} />
                </div>
             </div>
             <div className="mt-4">
                <label className="block text-xs font-medium text-text-secondary mb-1">Labels</label>
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface/80 border border-border-shadow shadow-inner rounded-md">
                     {item.labels.map(label => (
                        <span key={label} className="label-chip">
                            {label}
                            <button
                                type="button"
                                onClick={() => removeLabel(label)}
                                className="label-chip__remove"
                            >
                                <CloseIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={handleLabelKeyDown}
                        className="bg-transparent flex-grow p-1 text-sm focus:outline-none text-text-primary placeholder-text-muted min-w-[120px]"
                        placeholder="Add label..."
                    />
                </div>
            </div>
        </div>
    );
};

export default ReceiptItemEditor;