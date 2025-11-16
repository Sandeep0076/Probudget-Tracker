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
  console.log('[ProgressBar] Rendering with:', { progress, startDate, dueDate });
  const segments = 10;
  const filledSegments = Math.round((progress / 100) * segments);

  const handleSegmentClick = (index: number) => {
    // Clicking on segment sets progress to that percentage
    const newProgress = ((index + 1) / segments) * 100;
    console.log('[ProgressBar] Segment clicked:', index, 'New progress:', newProgress);
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
      <div 
        className="relative rounded-lg overflow-hidden border-2 border-brand/30 shadow-neu-sm"
        style={{ 
          background: 'var(--color-card-bg-light)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div className="flex h-8">
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
                  flex-1 relative transition-all duration-200
                  ${index !== 0 ? 'border-l border-border-highlight/20' : ''}
                  ${isFilled 
                    ? 'bg-gradient-to-b from-brand-light to-brand hover:from-brand hover:to-brand-dark shadow-inner' 
                    : 'bg-transparent hover:bg-accent-lighter/20'
                  }
                  group cursor-pointer
                `}
                style={{
                  boxShadow: isFilled 
                    ? 'inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,0.1)' 
                    : 'none'
                }}
                title={`Set progress to ${((index + 1) / segments) * 100}%`}
              >
                {/* Hover indicator */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                  ${isFilled ? 'bg-white/10' : 'bg-accent/10'}
                `} />
                
                {/* 3D effect highlight */}
                {isFilled && (
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/30 to-transparent"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Progress percentage overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full shadow-lg"
            style={{
              background: 'var(--color-modal-bg)',
              color: 'var(--color-text-primary)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Helper text */}
      <div className="text-xs text-center text-text-muted italic">
        Click on segments to update progress
      </div>
    </div>
  );
};

export default ProgressBar;