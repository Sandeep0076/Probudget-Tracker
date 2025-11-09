import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    const commonButtonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-all transform hover:scale-105";
    const activeClasses = "bg-brand text-white shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow";
    const inactiveClasses = "bg-surface hover:bg-surface/80 text-text-secondary shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow";
    const disabledClasses = "bg-surface/50 text-text-muted cursor-not-allowed shadow-inner";

    return (
        <div className="flex items-center justify-between mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${commonButtonClasses} ${currentPage === 1 ? disabledClasses : inactiveClasses}`}
            >
                Previous
            </button>
            <span className="text-sm text-text-secondary">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${commonButtonClasses} ${currentPage === totalPages ? disabledClasses : inactiveClasses}`}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;