// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace(/^[A-Za-z]/, '€'); // Ensure € symbol is used
};

/**
 * Converts a Date object to DATE format (YYYY-MM-DD) for database storage
 */
export const toDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Converts DATE format (YYYY-MM-DD) to Date object
 */
export const fromDateString = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00.000Z');
};

/**
 * Gets today's date in DATE format (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
    return toDateString(new Date());
};

export const formatDate = (dateString: string): string => {
    // Handle DATE format (YYYY-MM-DD) - no time component
    const date = new Date(dateString + 'T00:00:00.000Z'); // Ensure UTC interpretation for DATE format
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time for date comparison
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0); // Reset time for date comparison
    
    const diffTime = Math.abs(now.getTime() - dateOnly.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If today, show "Today"
    if (diffDays === 0) {
        return 'Today';
    }
    
    // If yesterday, show "Yesterday"
    if (diffDays === 1 && dateOnly < now) {
        return 'Yesterday';
    }
    
    // If tomorrow, show "Tomorrow"
    if (diffDays === 1 && dateOnly > now) {
        return 'Tomorrow';
    }
    
    // If within a week, show day name
    if (diffDays < 7) {
        return dateOnly.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return dateOnly.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
