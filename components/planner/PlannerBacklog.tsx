import React from 'react';
import { Task } from '../../types';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
}

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday }) => {
  const backlog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');

  return (
    <div className="bg-surface/70 border border-border-shadow rounded-xl p-4 shadow-neu-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">Backlogs</h3>
      </div>
      {backlog.length === 0 && (
        <div className="text-sm text-text-muted">No backlog tasks.</div>
      )}
      <div className="space-y-2">
        {backlog.map(t => (
          <div key={t.id} className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface/60">
            <div className="text-sm">{t.title}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => onPlanToday(t.id)} className="text-xs px-2 py-1 rounded-md bg-brand text-white">Plan Today</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerBacklog;
