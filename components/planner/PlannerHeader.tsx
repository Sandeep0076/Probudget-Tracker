import React from 'react';
import { SettingsIcon } from '../icons/SettingsIcon';
import { Page } from '../../App';

export type PlannerPage = 'dashboard' | 'progress' | 'calendar' | 'backlog';

interface PlannerHeaderProps {
  page: PlannerPage;
  onNavigate: (p: PlannerPage | Page) => void;
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
    className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-all border-b-2 ${
          active
            ? 'border-brand text-brand'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
  >
    {label}
  </a>
);

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ page, onNavigate, onNewTask }) => {
  return (
    <header className="bg-surface border-b border-border-shadow sticky top-12 z-40">
      <nav className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Item active={page==='dashboard'} label="Home/Dashboard" onClick={()=>onNavigate('dashboard')} />
            <Item active={page==='progress'} label="Progressing Tasks" onClick={()=>onNavigate('progress')} />
            <Item active={page==='calendar'} label="Calendar" onClick={()=>onNavigate('calendar')} />
            <Item active={page==='backlog'} label="Backlogs" onClick={()=>onNavigate('backlog')} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTask}
              className="px-3 py-2 text-sm font-medium rounded-md text-white bg-brand hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
            >
              New Task
            </button>
            <div className="h-6 w-px bg-border-shadow mx-2"></div>
            <button
              onClick={() => onNavigate('settings')}
              className="p-2 rounded-full text-text-secondary hover:bg-surface/70 hover:text-text-primary transition-colors"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default PlannerHeader;
