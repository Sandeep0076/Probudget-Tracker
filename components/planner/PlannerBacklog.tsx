import React from 'react';
import { Task } from '../../types';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
}

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday }) => {
  const backlog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');

  return (
    <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Backlogs</h3>
      </div>
      {backlog.length === 0 && (
        <div className="relative text-sm text-text-secondary">No backlog tasks.</div>
      )}
      <div className="relative space-y-2">
        {backlog.map(t => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
            <div className="text-sm text-text-primary font-semibold">{t.title}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => onPlanToday(t.id)} className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors shadow-[0_2px_4px_var(--color-shadow-dark)] hover:shadow-[0_4px_8px_var(--color-shadow-dark)] font-semibold">Plan Today</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerBacklog;
