import React, { useState, useMemo } from 'react';
import { ShoppingItem } from '../../types';
import { formatDate } from '../../utils/formatters';

interface PlannerToBuyProps {
  items: ShoppingItem[];
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (itemId: string) => void;
}

type SortOption = 'createdAt' | 'category';
type FilterOption = 'all' | 'pending' | 'completed';

const PlannerToBuy: React.FC<PlannerToBuyProps> = ({
  items,
  onAddItem,
  onToggleComplete,
  onEdit,
  onDelete
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (filterBy === 'pending') {
      filtered = items.filter(item => !item.completed);
    } else if (filterBy === 'completed') {
      filtered = items.filter(item => item.completed);
    }

    return filtered;
  }, [items, filterBy]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];

    if (sortBy === 'category') {
      sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt + 'T00:00:00.000Z').getTime() - new Date(a.createdAt + 'T00:00:00.000Z').getTime());
    }

    return sorted;
  }, [filteredItems, sortBy]);



  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    onAddItem({
      title: newItemTitle.trim(),
      category: newItemCategory.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
      priority: 'medium',
      completed: false,
      completedAt: null
    });

    setNewItemTitle('');
    setNewItemCategory('');
    setNewItemNotes('');
    setShowAddForm(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const pendingCount = items.filter(item => !item.completed).length;
  const completedCount = items.filter(item => item.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Shopping List</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-brand hover:bg-brand/90 transition-all transform hover:scale-105 shadow-neu-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Item</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Item Name</label>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What do you need to buy?"
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
              <input
                type="text"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                placeholder="e.g., Groceries, Electronics"
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
              <textarea
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
                placeholder="Additional details..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="text-sm px-3 py-1.5 rounded-lg bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm px-3 py-1.5 rounded-lg bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              >
                <option value="createdAt">Date Added</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-text-secondary">
            Showing {sortedItems.length} of {items.length} items
          </div>
        </div>

        {/* Items List */}
        <div className="mt-4 bg-surface/30 rounded-xl overflow-hidden border border-white/5">
          {sortedItems.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              {filterBy === 'all' ? 'No items in your shopping list yet.' :
                filterBy === 'pending' ? 'No pending items.' :
                  'No completed items.'}
            </div>
          )}

          <div className="divide-y divide-white/5">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center gap-3 px-4 py-1.5 hover:bg-white/5 transition-colors ${item.completed ? 'opacity-60 bg-surface/20' : ''
                  }`}
              >
                <div className="flex-shrink-0 flex items-center">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggleComplete(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/50 cursor-pointer"
                  />
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-sm font-medium truncate ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}>
                      {item.title}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface/50 text-text-secondary rounded">
                          {item.category}
                        </span>
                      )}
                      {item.notes && (
                        <div className="group/note relative">
                          <svg className="w-3.5 h-3.5 text-text-muted cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity z-10">
                            {item.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 hover:bg-surface/80 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 hover:bg-danger/20 rounded-lg text-text-secondary hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerToBuy;
