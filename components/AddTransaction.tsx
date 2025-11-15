import React, { useState, useEffect, useRef } from 'react';
import { TransactionFormData, TransactionType, Category } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface AddTransactionProps {
    onCancel: () => void;
    initialType: TransactionType;
    onSave: (data: TransactionFormData) => void;
    categories: Category[];
    onScanReceipt: (file: File) => Promise<void>;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onCancel, initialType, onSave, categories, onScanReceipt }) => {
    const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
    const [amount, setAmount] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [labels, setLabels] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const availableCategories = categories
        .filter(c => c.type === transactionType)
        .map(c => c.name);

    useEffect(() => {
        setTransactionType(initialType);
        const currentCategories = categories.filter(c => c.type === initialType);
        setCategory(currentCategories.length > 0 ? currentCategories[0].name : '');
    }, [initialType, categories]);
    
    useEffect(() => {
        const currentCategories = categories.filter(c => c.type === transactionType);
        setCategory(currentCategories.length > 0 ? currentCategories[0].name : '');
    }, [transactionType, categories]);

    const handleTypeChange = (type: TransactionType) => {
        setTransactionType(type);
    }

    const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newLabel = labelInput.trim().toLowerCase();
            if (newLabel && !labels.includes(newLabel)) {
                setLabels([...labels, newLabel]);
            }
            setLabelInput('');
        }
    };

    const removeLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !category) {
            alert('Please fill all fields');
            return;
        }

        const pending = labelInput.trim().toLowerCase();
        const finalLabels = pending && !labels.includes(pending)
            ? [...labels, pending]
            : labels;

        onSave({
            amount: parseFloat(amount),
            quantity: parseInt(quantity, 10) || 1,
            description,
            category,
            date,
            type: transactionType,
            labels: finalLabels,
            isRecurring,
        });
    };
    
    const handleScanClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // --- VALIDATION ---
            const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!acceptedTypes.includes(file.type)) {
                alert('Invalid file type. Please upload a JPG, PNG, or WebP image.');
                if (fileInputRef.current) { fileInputRef.current.value = ""; }
                return;
            }

            const maxSizeInMB = 5;
            if (file.size > maxSizeInMB * 1024 * 1024) {
                 alert(`File is too large. Please upload an image smaller than ${maxSizeInMB}MB.`);
                 if (fileInputRef.current) { fileInputRef.current.value = ""; }
                 return;
            }
            // --- END VALIDATION ---

            setIsScanning(true);
            try {
                await onScanReceipt(file);
            } catch(e) {
                // Error is handled in App.tsx with an alert, but good to log it here too.
                console.error("Receipt scan process failed:", e);
            } finally {
                setIsScanning(false);
                 // Reset file input value to allow re-uploading the same file
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };

    const commonInputClasses = "w-full px-4 py-3 bg-input-bg border border-input-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-inner transition-colors";

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 flex justify-center">
            <div className="w-full max-w-2xl modal-content bg-modal-bg backdrop-blur-xl p-8 rounded-xl shadow-neu-3d relative">

                {isScanning && (
                    <div className="absolute inset-0 bg-modal-bg/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20">
                        <SpinnerIcon className="w-12 h-12 animate-spin text-accent" />
                        <p className="mt-4 text-lg font-semibold text-text-primary">Scanning Receipt...</p>
                        <p className="text-sm text-text-secondary">Please wait while we analyze the items.</p>
                    </div>
                )}
                
                <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Add New Transaction</h2>
                <p className="text-text-secondary text-center mb-6">Enter details manually or scan a receipt.</p>
                
                <div className="mb-6">
                    <button onClick={handleScanClick} disabled={isScanning} className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-accent/50 text-sm font-semibold rounded-md shadow-neu-sm text-text-primary bg-accent/30 hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:cursor-wait">
                        <SparklesIcon className="w-5 h-5" />
                        {isScanning ? 'Analyzing Receipt...' : 'Scan Receipt with AI'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-grow h-px bg-border-shadow"></div>
                    <span className="text-sm text-text-secondary">OR</span>
                    <div className="flex-grow h-px bg-border-shadow"></div>
                </div>

                <div className="mb-6">
                    <div className="flex bg-surface shadow-inner rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                            className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${
                                transactionType === TransactionType.EXPENSE ? 'bg-accent text-white shadow-neu-sm' : 'text-text-secondary hover:bg-surface/70'
                            }`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange(TransactionType.INCOME)}
                            className={`w-1/2 py-2 rounded-md text-sm font-medium transition-colors ${
                                transactionType === TransactionType.INCOME ? 'bg-success text-white shadow-neu-sm' : 'text-text-secondary hover:bg-surface/70'
                            }`}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                            <div className="relative">
                               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <span className="text-text-muted">€</span>
                                </div>
                                <input
                                    type="number"
                                    name="amount"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className={`${commonInputClasses} pl-8`}
                                    placeholder="0.00"
                                    required
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className={commonInputClasses}
                                required
                                step="1"
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <input
                            type="text"
                            name="description"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={commonInputClasses}
                            placeholder="e.g., Coffee with friends"
                            required
                        />
                    </div>
                    
                     <div>
                        <label htmlFor="labels" className="block text-sm font-medium text-text-secondary mb-1">Labels (optional)</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-input-bg border border-input-border shadow-inner rounded-md">
                            {labels.map(label => (
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
                                id="labels"
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                onKeyDown={handleLabelKeyDown}
                                className="bg-transparent flex-grow p-1 focus:outline-none text-text-primary placeholder-text-muted min-w-[160px]"
                                placeholder="Add a label and press Enter..."
                            />
                        </div>
                        <p className="text-xs text-text-muted mt-1">Separate labels with a comma or by pressing Enter.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                            <select
                                name="category"
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={commonInputClasses}
                                style={{ backgroundPosition: 'right 1rem center' }}
                            >
                                {availableCategories.length === 0 && <option disabled>Create a category first</option>}
                                {availableCategories.map(cat => <option key={cat} value={cat} className="bg-background-end">{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">
                                {isRecurring ? 'Start Date' : 'Date'}
                            </label>
                            <input
                                type="date"
                                name="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={commonInputClasses}
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-input-bg p-4 rounded-lg shadow-inner border border-input-border">
                        <label htmlFor="recurring-toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="recurring-toggle" className="sr-only" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} />
                                <div className="block bg-input-border w-14 h-8 rounded-full shadow-inner"></div>
                                <div className={`dot absolute left-1 top-1 bg-surface-white w-6 h-6 rounded-full transition-transform shadow-neu-sm ${isRecurring ? 'translate-x-6 bg-accent' : ''}`}></div>
                            </div>
                        </label>
                        <div>
                           <span className="text-sm font-medium text-text-primary">Recurring Transaction</span>
                           <p className="text-xs text-text-secondary">
                                {isRecurring ? "This transaction will be created monthly on the selected day." : "Enable for subscriptions or monthly bills."}
                           </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="custom-styled px-6 py-3 text-sm font-medium rounded-md bg-input-bg text-text-primary border border-input-border hover:opacity-80 transition-all shadow-neu-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="custom-styled px-6 py-3 text-sm font-medium rounded-md shadow-sm bg-button-primary text-button-text hover:opacity-90 transition-all shadow-neu-sm"
                        >
                            Save Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransaction;
