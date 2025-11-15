import React, { useState } from 'react';
import { Theme } from '../App';
import { PaletteIcon } from './icons/PaletteIcon';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  customThemeColor: string;
  onCustomColorChange: (color: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  currentTheme, 
  onThemeChange, 
  customThemeColor, 
  onCustomColorChange 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const themes: { id: Theme, name: string, bg: string }[] = [
    { id: 'dark-blue', name: 'Blue', bg: 'bg-gradient-to-br from-[#2563eb] to-[#1e3a8a]' },
    { id: 'light', name: 'White', bg: 'bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]' },
    { id: 'dark', name: 'Black', bg: 'bg-gradient-to-br from-[#2d3748] to-[#1a202c]' },
  ];

  const getModalBg = () => {
    switch(currentTheme) {
      case 'dark-blue':
        return 'rgba(37, 99, 235, 0.98)';
      case 'light':
        return 'rgba(255, 255, 255, 0.98)';
      case 'dark':
        return 'rgba(45, 55, 72, 0.98)';
      case 'custom':
        return 'rgba(42, 15, 74, 0.98)';
      default:
        return 'rgba(255, 255, 255, 0.98)';
    }
  };

  const getTextColor = () => {
    return currentTheme === 'light' ? '#1e293b' : '#f8fafc';
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
        title="Change Theme"
      >
        <PaletteIcon className="w-5 h-5 text-text-primary" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 z-50" onClick={() => setIsModalOpen(false)}>
          <div className="p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow max-w-2xl w-full mx-4" style={{ backgroundColor: getModalBg() }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: getTextColor() }}>Theme</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setIsModalOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    currentTheme === theme.id ? 'border-accent scale-105 shadow-neu-lg' : 'border-transparent hover:scale-105 bg-surface shadow-inner'
                  }`}
                >
                  <div className={`w-16 h-10 rounded-md ${theme.bg} mb-2 border border-border-shadow`}></div>
                  <span className={`text-sm font-medium ${currentTheme === theme.id ? 'text-accent' : ''}`} style={{ color: currentTheme === theme.id ? undefined : getTextColor() }}>{theme.name}</span>
                </button>
              ))}
              <div
                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 ${
                  currentTheme === 'custom' ? 'border-accent scale-105 shadow-neu-lg' : 'border-transparent hover:scale-105 bg-surface shadow-inner'
                }`}
              >
                <label htmlFor="color-picker" className="cursor-pointer">
                  <div className={`w-16 h-10 rounded-md mb-2 border border-border-shadow`} style={{ background: customThemeColor }}></div>
                </label>
                <input
                  id="color-picker"
                  type="color"
                  value={customThemeColor}
                  onChange={(e) => onCustomColorChange(e.target.value)}
                  className="w-0 h-0 opacity-0"
                />
                <button onClick={() => onThemeChange('custom')} className={`text-sm font-medium ${currentTheme === 'custom' ? 'text-accent' : ''}`} style={{ color: currentTheme === 'custom' ? undefined : getTextColor() }}>
                  Custom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelector;