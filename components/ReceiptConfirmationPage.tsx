import React, { useState } from 'react';
import { TransactionFormData, Category } from '../types';
import ReceiptItemEditor from './ReceiptItemEditor';

interface ReceiptConfirmationPageProps {
    items: TransactionFormData[];
    onSaveAll: (items: TransactionFormData[]) => void;
    onCancel: () => void;
    categories: Category[];
}

const ReceiptConfirmationPage: React.FC<ReceiptConfirmationPageProps> = ({ items, onSaveAll, onCancel, categories }) => {
    const [editedItems, setEditedItems] = useState<TransactionFormData[]>(items);

    const handleItemChange = (index: number, updatedItem: TransactionFormData) => {
        const newItems = [...editedItems];
        newItems[index] = updatedItem;
        setEditedItems(newItems);
    };

    const handleItemRemove = (index: number) => {
        const newItems = editedItems.filter((_, i) => i !== index);
        setEditedItems(newItems);
    };
    
    const handleSave = () => {
        if (editedItems.length > 0) {
            onSaveAll(editedItems);
        } else {
            // If all items were removed, just cancel
            onCancel();
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Confirm Scanned Transactions</h1>
                <p className="text-text-secondary mb-6">Review the items found on your receipt. Edit any details as needed before saving.</p>

                <div className="space-y-4 mb-8">
                    {editedItems.map((item, index) => (
                        <ReceiptItemEditor
                            key={index}
                            item={item}
                            categories={categories}
                            onChange={(updatedItem) => handleItemChange(index, updatedItem)}
                            onRemove={() => handleItemRemove(index)}
                        />
                    ))}
                </div>

                {editedItems.length === 0 && (
                    <div className="text-center text-text-secondary py-16 bg-surface rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                        <p className="text-lg">All items have been removed.</p>
                        <p className="mt-2 text-sm">Cancel to go back and scan a new receipt.</p>
                    </div>
                )}
                
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-border-shadow">
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="px-6 py-3 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave}
                        disabled={editedItems.length === 0}
                        className="px-6 py-3 text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand/90 disabled:bg-surface/50 disabled:cursor-not-allowed disabled:shadow-inner transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                    >
                        Save All Transactions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptConfirmationPage;