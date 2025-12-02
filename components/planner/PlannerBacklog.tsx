import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { formatDate } from '../../utils/formatters';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onConvertToTodo?: (taskId: string) => void;
}

type SortOption = 'priority' | 'createdAt';

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday, onEdit, onDelete, onConvertToTodo }) => {
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');

  // Defensive: ensure no deleted tasks show (deleted tasks should not be in array after API delete)
  // Filter backlog: tasks without start/due & not completed; optionally status filter (allow user to narrow by status new/backlog/in_progress)
  const rawBacklog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');
  console.log('[PlannerBacklog] Raw backlog size:', rawBacklog.length, 'from total:', tasks.length);

  const filteredBacklog = useMemo(() => {
    let list = rawBacklog;
    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
    }
    console.log('[PlannerBacklog] Filters applied:', { statusFilter, search, resulting: list.length });
    return list;
  }, [rawBacklog, statusFilter, search]);

  const sortedBacklog = useMemo(() => {
    const sorted = [...filteredBacklog];
    console.log('[PlannerBacklog] Sorting filtered backlog by:', sortBy, 'count:', filteredBacklog.length);
    
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      console.log('[PlannerBacklog] Sorted by priority:', sorted.map(t => ({ title: t.title, priority: t.priority })));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt + 'T00:00:00.000Z').getTime() - new Date(a.createdAt + 'T00:00:00.000Z').getTime());
      console.log('[PlannerBacklog] Sorted by creation date:', sorted.map(t => ({ title: t.title, createdAt: t.createdAt })));
    }
    
    return sorted;
  }, [filteredBacklog, sortBy]);

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

  console.log('[PlannerBacklog] Total filtered/sorted:', sortedBacklog.length);

  return (
    <div className="bg-card-bg backdrop-blur-xl rounded-xl p-4 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300 h-[450px] flex flex-col">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search backlog..."
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              console.log('[PlannerBacklog] Search changed:', v);
              setSearch(v);
            }}
            className="flex-1 text-xs px-2 py-1 rounded-lg bg-card-bg-dark backdrop-blur-sm border border-input-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value as typeof statusFilter;
              console.log('[PlannerBacklog] Status filter changed:', v);
              setStatusFilter(v);
            }}
            className="text-xs px-2 py-1 rounded-lg bg-card-bg-dark backdrop-blur-sm border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brand-dark scrollbar-track-transparent">
        {sortedBacklog.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-text-secondary">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-text-muted">No backlog tasks</p>
            </div>
          </div>
        ) : (
          <div className="relative space-y-2">
            {sortedBacklog.map(t => (
          <div key={t.id} className="group flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-sm text-text-primary font-semibold">{t.title}</div>
                {t.estimatedTime && (
                  <div className="text-xs font-medium text-danger shrink-0">
                    {t.estimatedTime}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`font-medium ${getPriorityColor(t.priority)}`}>
                  {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)} Priority
                </span>
                <span className="text-text-secondary">
                  Created: {formatDate(t.createdAt)}
                </span>
                {t.status && (
                  <span className="text-text-muted capitalize">{t.status.replace('_', ' ')}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {onConvertToTodo && t.taskType === 'schedule' && (
                <button
                  onClick={() => {
                    console.log('[PlannerBacklog] Convert to To Do button clicked for task:', t.id, t.title);
                    onConvertToTodo(t.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-brand/10 rounded-lg transition-opacity"
                  title="Convert to To Do"
                >
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              )}
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
        )}
      </div>
    </div>
  );
};

export default PlannerBacklog;
