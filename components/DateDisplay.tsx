import React, { useState, useEffect } from 'react';

interface DateDisplayProps {
  className?: string;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Update date every 6 hours to keep it current
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 21600000); // Update every 6 hours (6 * 60 * 60 * 1000 ms)

    return () => clearInterval(timer);
  }, []);

  const formatSimpleDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Simple Date Display - Same size, beautiful typography */}
      <div className="flex items-center">
        <span className="text-sm sm:text-lg font-bold text-text-primary tracking-wide whitespace-nowrap">
          {formatSimpleDate(currentDate)}
        </span>
      </div>
    </div>
  );
};

export default DateDisplay;
