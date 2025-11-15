import React from 'react';
import ThemeSelector from './ThemeSelector';
import { Theme } from '../App';

interface TopSwitcherProps {
  section: 'budget' | 'planner';
  onChange: (s: 'budget' | 'planner') => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  customThemeColor: string;
  onCustomColorChange: (color: string) => void;
  username: string;
  onUsernameChange: (username: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
}

const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }>=({ active, onClick, children })=>{
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow ${
        active ? 'bg-surface text-text-primary shadow-neu-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface/70'
      }`}
    >
      {children}
    </button>
  );
};

const TopSwitcher: React.FC<TopSwitcherProps> = ({
  section,
  onChange,
  currentTheme,
  onThemeChange,
  customThemeColor,
  onCustomColorChange,
  username,
  onUsernameChange,
  password,
  onPasswordChange
}) => {
  return (
    <div className="bg-surface/80 backdrop-blur-xl border-b border-border-shadow shadow-neu-lg sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <Tab active={section === 'budget'} onClick={() => onChange('budget')}>Budget</Tab>
            <Tab active={section === 'planner'} onClick={() => onChange('planner')}>Planner</Tab>
          </div>
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
            customThemeColor={customThemeColor}
            onCustomColorChange={onCustomColorChange}
            username={username}
            onUsernameChange={onUsernameChange}
            password={password}
            onPasswordChange={onPasswordChange}
          />
        </div>
      </div>
    </div>
  );
};

export default TopSwitcher;
