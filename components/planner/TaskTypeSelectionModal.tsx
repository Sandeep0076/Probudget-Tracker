import React from 'react';

interface TaskTypeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'todo' | 'schedule') => void;
}

const TaskTypeSelectionModal: React.FC<TaskTypeSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-modal-bg backdrop-blur-xl rounded-2xl p-6 shadow-neu-3d border border-white/10 animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-text-primary mb-2">Create New</h3>
                    <p className="text-text-secondary text-sm">What would you like to add to your planner?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onSelect('todo')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-card-bg border border-transparent hover:border-brand/50 hover:bg-brand/5 transition-all duration-200 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <span className="font-semibold text-text-primary">Task</span>
                        <span className="text-xs text-text-secondary mt-1">To-do item</span>
                    </button>

                    <button
                        onClick={() => onSelect('schedule')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-card-bg border border-transparent hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="font-semibold text-text-primary">Schedule</span>
                        <span className="text-xs text-text-secondary mt-1">Time-blocked event</span>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default TaskTypeSelectionModal;
