import React from 'react';
import { Theme } from '../App';
import { ActivityLog } from '../types';

interface SettingsPageProps {
    currentTheme: Theme;
    onThemeChange: (theme: Theme) => void;
    customThemeColor: string;
    onCustomColorChange: (color: string) => void;
    activityLogs: ActivityLog[];
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentTheme, onThemeChange, customThemeColor, onCustomColorChange, activityLogs }) => {

    const themes: { id: Theme, name: string, bg: string }[] = [
        { id: 'dark-blue', name: 'Blue', bg: 'bg-gradient-to-br from-[#2563eb] to-[#1e3a8a]' },
        { id: 'light', name: 'White', bg: 'bg-gradient-to-br from-[#f1f5f9] to-[#dbeafe]' },
        { id: 'dark', name: 'Black', bg: 'bg-gradient-to-br from-[#2d3748] to-[#1a202c]' },
    ];

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                {/* Theme Settings */}
                <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Theme</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => onThemeChange(theme.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                    currentTheme === theme.id ? 'border-accent scale-105 shadow-neu-lg' : 'border-transparent hover:scale-105 bg-surface shadow-inner'
                                }`}
                            >
                                <div className={`w-16 h-10 rounded-md ${theme.bg} mb-2 border border-border-shadow`}></div>
                                <span className={`text-sm font-medium ${currentTheme === theme.id ? 'text-accent' : 'text-text-secondary'}`}>{theme.name}</span>
                            </button>
                        ))}
                         {/* Custom Theme Picker */}
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
                            <button onClick={() => onThemeChange('custom')} className={`text-sm font-medium ${currentTheme === 'custom' ? 'text-accent' : 'text-text-secondary'}`}>
                                Custom
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Activity Log</h2>
                    <div className="space-y-3 max-h-[40rem] overflow-y-auto pr-2">
                        {activityLogs.length > 0 ? activityLogs.map(log => (
                            <div key={log.id} className="text-sm p-3 bg-surface rounded-lg shadow-inner">
                                <p className="text-text-primary font-medium">{log.description}</p>
                                <p className="text-xs text-text-muted mt-1">{formatTimestamp(log.timestamp)}</p>
                            </div>
                        )) : (
                            <div className="text-center text-text-secondary py-16">
                                <p>No recent activity.</p>
                                <p className="text-sm">Updates and deletions will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
