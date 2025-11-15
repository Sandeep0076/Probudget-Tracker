import React, { useState } from 'react';
import { Theme } from '../App';
import { PaletteIcon } from './icons/PaletteIcon';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  customThemeColor: string;
  onCustomColorChange: (color: string) => void;
  username: string;
  onUsernameChange: (username: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  customThemeColor,
  onCustomColorChange,
  username,
  onUsernameChange,
  password,
  onPasswordChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localUsername, setLocalUsername] = useState(username);
  const [localPassword, setLocalPassword] = useState(password);
  const [showSaved, setShowSaved] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [passwordSaveTimeout, setPasswordSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showPasswordSaved, setShowPasswordSaved] = useState(false);
  
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

  const handleUsernameChange = (value: string) => {
    setLocalUsername(value);
    
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      onUsernameChange(value);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 500);
    
    setSaveTimeout(timeout);
  };

  const handlePasswordChange = (value: string) => {
    setLocalPassword(value);
    
    if (passwordSaveTimeout) {
      clearTimeout(passwordSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      onPasswordChange(value);
      setShowPasswordSaved(true);
      setTimeout(() => setShowPasswordSaved(false), 2000);
    }, 500);
    
    setPasswordSaveTimeout(timeout);
  };

  React.useEffect(() => {
    setLocalUsername(username);
  }, [username]);

  React.useEffect(() => {
    setLocalPassword(password);
  }, [password]);

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
            <h2 className="text-xl font-semibold mb-4" style={{ color: getTextColor() }}>Settings</h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: getTextColor() }}>Username</label>
                {showSaved && (
                  <span className="text-xs text-green-500 font-medium animate-pulse">✓ Saved</span>
                )}
              </div>
              <input
                type="text"
                value={localUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-shadow text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: getTextColor() }}>Password</label>
                {showPasswordSaved && (
                  <span className="text-xs text-green-500 font-medium animate-pulse">✓ Saved</span>
                )}
              </div>
              <input
                type="password"
                value={localPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-shadow text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your password"
              />
            </div>

            <h3 className="text-lg font-semibold mb-3" style={{ color: getTextColor() }}>Theme</h3>
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