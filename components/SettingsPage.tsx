import React from 'react';
import { ActivityLog } from '../types';

interface SettingsPageProps {
    activityLogs: ActivityLog[];
    isGoogleConnected: boolean;
    onConnectGoogle: () => void;
    onDisconnectGoogle: () => void;
    onRepairDatabase: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activityLogs, isGoogleConnected, onConnectGoogle, onDisconnectGoogle, onRepairDatabase }) => {

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Integrations */}
                <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-fit">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Integrations</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-surface rounded-lg shadow-inner text-sm text-text-secondary">
                            <p>Google Calendar integration has been disabled.</p>
                        </div>
                    </div>
                </div>
                {/* System Maintenance */}
                <div className="bg-surface backdrop-blur-xl p-6 rounded-xl shadow-neu-lg border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow h-fit mt-8">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">System Maintenance</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface rounded-lg shadow-inner">
                            <div>
                                <h3 className="font-medium text-text-primary">Database Integrity</h3>
                                <p className="text-xs text-text-secondary">Fix missing columns or schema issues.</p>
                            </div>
                            <button
                                onClick={onRepairDatabase}
                                className="px-3 py-1.5 text-sm text-white bg-warning hover:bg-warning/90 rounded-md shadow-neu-sm transition-transform transform hover:scale-105"
                            >
                                Repair Database
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
