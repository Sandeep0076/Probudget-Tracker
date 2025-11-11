import React from 'react';
import { SettingsIcon } from '../icons/SettingsIcon';
import { LogoIcon } from '../icons/LogoIcon';
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
    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-text-primary" />
              <span className="text-xl font-bold text-text-primary">ProBudget</span>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
            <Item active={page==='dashboard'} label="Dashboard" onClick={()=>onNavigate('dashboard')} />
            <Item active={page==='progress'} label="Progressing Tasks" onClick={()=>onNavigate('progress')} />
            <Item active={page==='calendar'} label="Calendar" onClick={()=>onNavigate('calendar')} />
            <Item active={page==='backlog'} label="Backlogs" onClick={()=>onNavigate('backlog')} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-brand hover:bg-brand/90 transition-all transform hover:scale-105 shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
            >
              <span>New Task</span>
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
