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

type SortOption = 'priority' | 'createdAt' | 'category';
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
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
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

    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt + 'T00:00:00.000Z').getTime() - new Date(a.createdAt + 'T00:00:00.000Z').getTime());
    }

    return sorted;
  }, [filteredItems, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-danger';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-text-secondary';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
    }
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;

    onAddItem({
      title: newItemTitle.trim(),
      category: newItemCategory.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
      priority: newItemPriority,
      completed: false,
      completedAt: null
    });

    setNewItemTitle('');
    setNewItemCategory('');
    setNewItemNotes('');
    setNewItemPriority('medium');
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
                <select
                  value={newItemPriority}
                  onChange={(e) => setNewItemPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
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
                <option value="priority">Priority</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-text-secondary">
            Showing {sortedItems.length} of {items.length} items
          </div>
        </div>

        {/* Items List */}
        <div className="mt-6 space-y-2">
          {sortedItems.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              {filterBy === 'all' ? 'No items in your shopping list yet.' :
                filterBy === 'pending' ? 'No pending items.' :
                  'No completed items.'}
            </div>
          )}

          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-4 p-4 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-all duration-200 hover:-translate-y-0.5 ${item.completed ? 'opacity-75' : ''
                }`}
            >
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onToggleComplete(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand/50"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}>
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {item.category && (
                        <span className="text-xs px-2 py-1 bg-surface/50 text-text-secondary rounded-full">
                          {item.category}
                        </span>
                      )}

                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityBadge(item.priority)}`}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </span>

                      <span className="text-xs text-text-muted">
                        Added: {formatDate(item.createdAt)}
                      </span>

                      {item.completed && item.completedAt && (
                        <span className="text-xs text-success">
                          Completed: {formatDate(item.completedAt)}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className={`text-xs mt-2 ${item.completed ? 'text-text-muted' : 'text-text-secondary'
                        }`}>
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-border-highlight rounded-lg transition-opacity"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger/10 rounded-lg transition-opacity"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlannerToBuy;
