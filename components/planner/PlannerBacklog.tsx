import React from 'react';
import { Task } from '../../types';

interface PlannerBacklogProps {
  tasks: Task[];
  onPlanToday: (id: string) => void;
}

const PlannerBacklog: React.FC<PlannerBacklogProps> = ({ tasks, onPlanToday }) => {
  const backlog = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');

  return (
    <div className="bg-white rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600">Backlogs</h3>
      </div>
      {backlog.length === 0 && (
        <div className="text-sm text-gray-500">No backlog tasks.</div>
      )}
      <div className="space-y-2">
        {backlog.map(t => (
          <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="text-sm text-gray-800">{t.title}</div>
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
