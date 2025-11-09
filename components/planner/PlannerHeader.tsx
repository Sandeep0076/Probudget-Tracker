import React from 'react';

export type PlannerPage = 'dashboard' | 'progress' | 'calendar' | 'backlog';

interface PlannerHeaderProps {
  page: PlannerPage;
  onNavigate: (p: PlannerPage) => void;
  onNewTask: () => void;
}

const Item: React.FC<{active:boolean;label:string;onClick:()=>void}> = ({
  active,
  label,
  onClick,
}) => (
  <a
    href="#"
    onClick={(e)=>{e.preventDefault();onClick();}}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
      active
        ? 'bg-surface shadow-inner text-text-primary'
        : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary'
    }`}
  >
    {label}
  </a>
);

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ page, onNavigate, onNewTask }) => {
  return (
    <header className="bg-surface/80 backdrop-blur-xl border-b border-border-shadow shadow-neu-lg sticky top-12 z-40">
      <nav className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Item active={page==='dashboard'} label="Home/Dashboard" onClick={()=>onNavigate('dashboard')} />
            <Item active={page==='progress'} label="Progressing Tasks" onClick={()=>onNavigate('progress')} />
            <Item active={page==='calendar'} label="Calendar" onClick={()=>onNavigate('calendar')} />
            <Item active={page==='backlog'} label="Backlogs" onClick={()=>onNavigate('backlog')} />
          </div>
          <button
            onClick={onNewTask}
            className="px-3 py-2 text-sm font-medium rounded-md text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
          >
            New Task
          </button>
        </div>
      </nav>
    </header>
  );
};

export default PlannerHeader;
