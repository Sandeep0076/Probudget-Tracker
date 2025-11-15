import React from 'react';
import { Task } from '../../types';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
}

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday }) => {
  const backlog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');

  return (
    <div className="relative bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 border border-white/40">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <div className="relative flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Backlogs</h3>
      </div>
      {backlog.length === 0 && (
        <div className="relative text-sm text-gray-600">No backlog tasks.</div>
      )}
      <div className="relative space-y-2">
        {backlog.map(t => (
          <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="text-sm text-text-dark font-medium">{t.title}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => onPlanToday(t.id)} className="text-xs px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand/90 transition-colors shadow-neu-xs">Plan Today</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerBacklog;
