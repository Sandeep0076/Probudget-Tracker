import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { formatDate } from '../../utils/formatters';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

type SortOption = 'priority' | 'createdAt';

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday, onEdit, onDelete }) => {
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  
  const backlog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');
  console.log('[PlannerBacklog] Filtering backlog tasks - total tasks:', tasks.length, 'backlog tasks:', backlog.length);
  console.log('[PlannerBacklog] Backlog tasks:', backlog.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, createdAt: t.createdAt })));

  const sortedBacklog = useMemo(() => {
    const sorted = [...backlog];
    console.log('[PlannerBacklog] Sorting by:', sortBy);
    
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      console.log('[PlannerBacklog] Sorted by priority:', sorted.map(t => ({ title: t.title, priority: t.priority })));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log('[PlannerBacklog] Sorted by creation date:', sorted.map(t => ({ title: t.title, createdAt: t.createdAt })));
    }
    
    return sorted;
  }, [backlog, sortBy]);

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

  return (
    <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Backlogs</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              const newSort = e.target.value as SortOption;
              console.log('[PlannerBacklog] Sort option changed to:', newSort);
              setSortBy(newSort);
            }}
            className="text-xs px-2 py-1 rounded-lg bg-card-bg-dark backdrop-blur-sm border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
          >
            <option value="createdAt">Creation Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>
      {sortedBacklog.length === 0 && (
        <div className="relative text-sm text-text-secondary">No backlog tasks.</div>
      )}
      <div className="relative space-y-2">
        {sortedBacklog.map(t => (
          <div key={t.id} className="group flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
            <div className="flex-1">
              <div className="text-sm text-text-primary font-semibold mb-1">{t.title}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`font-medium ${getPriorityColor(t.priority)}`}>
                  {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)} Priority
                </span>
                <span className="text-text-secondary">
                  Created: {formatDate(t.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => {
                  console.log('[PlannerBacklog] Edit button clicked for task:', t.id, t.title);
                  onEdit(t);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-border-highlight rounded-lg transition-opacity"
                title="Edit"
              >
                <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  console.log('[PlannerBacklog] Delete button clicked for task:', t.id, t.title);
                  onDelete(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger/10 rounded-lg transition-opacity"
                title="Delete"
              >
                <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => {
                  console.log('[PlannerBacklog] Plan Today button clicked for task:', t.id, t.title);
                  onPlanToday(t.id);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors shadow-[0_2px_4px_var(--color-shadow-dark)] hover:shadow-[0_4px_8px_var(--color-shadow-dark)] font-semibold"
              >
                Plan Today
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerBacklog;
