import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ShoppingItem } from '../types';

interface ShoppingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
  initialItem?: ShoppingItem;
}

const ShoppingItemModal: React.FC<ShoppingItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setCategory(initialItem.category || '');
      setNotes(initialItem.notes || '');
      setPriority(initialItem.priority);
    } else {
      setTitle('');
      setCategory('');
      setNotes('');
      setPriority('medium');
    }
  }, [initialItem, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      priority,
      completed: initialItem?.completed || false,
      completedAt: initialItem?.completedAt || null
    });
    
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card-bg backdrop-blur-xl rounded-xl shadow-neu-3d border border-border-shadow w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border-shadow">
          <h2 className="text-xl font-semibold text-text-primary">
            {initialItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface/50 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What do you need to buy?"
              className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Groceries, Electronics"
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, brand preferences, etc..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border-shadow">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-neu-sm"
          >
            {initialItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingItemModal;
