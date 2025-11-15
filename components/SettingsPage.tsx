import React from 'react';
import { ActivityLog } from '../types';

interface SettingsPageProps {
    activityLogs: ActivityLog[];
}

const SettingsPage: React.FC<SettingsPageProps> = ({ activityLogs }) => {

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-text-primary mb-8">Activity Log</h1>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
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
