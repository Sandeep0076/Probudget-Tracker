import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  startDate?: string;
  dueDate?: string;
  onProgressChange: (newProgress: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  startDate,
  dueDate,
  onProgressChange
}) => {
  const segments = 10;
  const filledSegments = Math.round((progress / 100) * segments);

  const handleSegmentClick = (index: number) => {
    // Clicking on segment sets progress to that percentage
    // index 0 -> 10%, index 9 -> 100%
    const newProgress = ((index + 1) / segments) * 100;
    onProgressChange(newProgress);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Date labels */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted font-medium">
          Start: <span className="text-text-secondary">{formatDate(startDate)}</span>
        </span>
        <span className="text-text-muted font-medium">
          Due: <span className="text-text-secondary">{formatDate(dueDate)}</span>
        </span>
      </div>

      {/* Progress bar with 10 segments */}
      <div className="relative">
        <div className="flex h-8 gap-1.5">
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index < filledSegments;
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSegmentClick(index);
                }}
                className={`
                  flex-1 relative transition-all duration-300 rounded-md
                  ${isFilled
                    ? 'bg-gradient-to-br from-brand to-brand-dark shadow-neu-sm border-t border-white/20'
                    : 'bg-card-bg-darker shadow-inner border border-white/5 opacity-60 hover:opacity-100'
                  }
                  group cursor-pointer overflow-hidden
                `}
                title={`Set progress to ${((index + 1) / segments) * 100}%`}
              >
                {/* Glossy highlight for 3D effect */}
                {isFilled && (
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-white/30" />
                )}

                {/* Hover glow */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${isFilled ? 'bg-white/10' : 'bg-white/5'}
                `} />
              </button>
            );
          })}
        </div>

        {/* Progress percentage overlay - centered */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              color: 'var(--color-brand-dark)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Helper text */}
      <div className="text-[10px] text-center text-text-muted italic">
        Click bars to update progress
      </div>
    </div>
  );
};

export default ProgressBar;