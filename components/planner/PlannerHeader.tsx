import React, { useState } from 'react';
import { SettingsIcon } from '../icons/SettingsIcon';
import { LogoIcon } from '../icons/LogoIcon';
import { MenuIcon } from '../icons/MenuIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { Page } from '../../App';

export type PlannerPage = 'todo' | 'schedule' | 'calendar' | 'toBuy' | 'trash';

interface PlannerHeaderProps {
  page: PlannerPage;
  onNavigate: (p: PlannerPage | Page) => void;
  onNewTask: (taskType: 'todo' | 'schedule') => void;
}

const Item: React.FC<{ active: boolean; label: string; onClick: () => void; icon?: React.ReactNode }> = ({
  active,
  label,
  onClick,
  icon
}) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${active
        ? 'bg-surface shadow-inner text-text-primary'
        : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary'
      }`}
    title={label}
  >
    {icon || label}
  </a>
);

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ page, onNavigate, onNewTask }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);

  const navItems: { name: string, page: PlannerPage, icon?: React.ReactNode }[] = [
    { name: 'To Do', page: 'todo' },
    { name: 'Schedule', page: 'schedule' },
    { name: 'Calendar', page: 'calendar' },
    { name: 'To Buy', page: 'toBuy' },
    { name: 'Trashbox', page: 'trash', icon: <TrashIcon className="w-5 h-5" /> },
  ];

  const handleMobileNavClick = (p: PlannerPage | Page) => {
    console.log('PlannerHeader: Mobile nav clicked ->', p);
    onNavigate(p);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-surface/80 backdrop-blur-xl border-b border-border-shadow shadow-neu-lg sticky top-12 z-40">
        <nav className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <LogoIcon className="h-8 w-8 text-text-primary" />
                <span className="text-xl font-bold text-text-primary">ProBudget</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => (
                    <Item
                      key={item.name}
                      active={page === item.page}
                      label={item.name}
                      onClick={() => onNavigate(item.page)}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-brand hover:bg-brand/90 transition-all transform hover:scale-105 shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
                >
                  <span className="hidden sm:inline">New</span>
                  <span className="sm:hidden">+</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isNewDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsNewDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card-bg backdrop-blur-xl rounded-lg shadow-neu-3d border border-border-shadow z-20">
                      <button
                        onClick={() => {
                          onNewTask('todo');
                          setIsNewDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface/70 transition-colors rounded-t-lg"
                      >
                        Tasks
                      </button>
                      <button
                        onClick={() => {
                          onNewTask('schedule');
                          setIsNewDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface/70 transition-colors rounded-b-lg"
                      >
                        Schedule
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2">
                <div className="h-6 w-px bg-border-shadow mx-2"></div>
                <button
                  onClick={() => onNavigate('settings')}
                  className="p-2 rounded-full text-text-secondary hover:bg-surface/70 hover:text-text-primary transition-colors"
                  aria-label="Open settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 rounded-full text-text-secondary hover:bg-surface/70 hover:text-text-primary transition-colors"
                  aria-label="Open menu"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-surface/80 backdrop-blur-xl z-50 transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-between items-center border-b border-border-shadow">
            <h2 className="font-bold text-text-primary">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-text-secondary hover:text-text-primary"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-grow p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = page === item.page;
              return (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleMobileNavClick(item.page); }}
                  className={`block px-4 py-3 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 ${isActive ? 'bg-surface shadow-inner text-text-primary' : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary'
                    }`}
                >
                  {item.icon ? (
                    <>
                      {item.icon}
                      <span>{item.name}</span>
                    </>
                  ) : item.name}
                </a>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border-shadow space-y-3">
            <button
              onClick={() => { handleMobileNavClick('settings'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-surface/80 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlannerHeader;
