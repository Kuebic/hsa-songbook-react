/**
 * @file Pagination.tsx
 * @description Enhanced pagination component with responsive design and advanced features
 */

import React, { useState, useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Whether pagination is disabled */
  disabled?: boolean;
  /** Whether to show page size selector */
  showPageSizeSelector?: boolean;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Whether to show total items count */
  showTotal?: boolean;
  /** Whether to show jump to page input */
  showJumpToPage?: boolean;
  /** Whether to show first/last page buttons */
  showFirstLast?: boolean;
  /** Maximum number of visible page buttons */
  maxVisiblePages?: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** CSS class name */
  className?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Custom labels */
  labels?: {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    pageSize?: string;
    jumpToPage?: string;
    totalItems?: string;
  };
}

/**
 * Enhanced pagination component
 * 
 * Features:
 * - Responsive design with mobile-friendly controls
 * - Page size selector
 * - Jump-to-page input
 * - First/Last page buttons
 * - Keyboard navigation support
 * - Loading states
 * - Customizable labels and styling
 * - Accessibility improvements
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   totalItems={400}
 *   pageSize={20}
 *   onPageChange={handlePageChange}
 *   onPageSizeChange={handlePageSizeChange}
 *   showPageSizeSelector={true}
 *   showJumpToPage={true}
 *   showTotal={true}
 * />
 * ```
 */
export const Pagination = React.memo<PaginationProps>(({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal = false,
  showJumpToPage = false,
  showFirstLast = false,
  maxVisiblePages = 5,
  size = 'medium',
  className,
  isLoading = false,
  labels = {}
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  const defaultLabels = {
    previous: 'Previous',
    next: 'Next',
    first: 'First',
    last: 'Last',
    pageSize: 'Show',
    jumpToPage: 'Go to page',
    totalItems: 'items',
    ...labels
  };

  // Get visible page numbers with ellipsis
  const getVisiblePages = useCallback(() => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      } else if (currentPage > totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Handle page change with validation
  const handlePageChange = useCallback((page: number) => {
    if (disabled || isLoading) return;
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }, [currentPage, totalPages, onPageChange, disabled, isLoading]);

  // Handle jump to page
  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPageValue, 10);
    if (!isNaN(page)) {
      handlePageChange(page);
      setJumpToPageValue('');
    }
  }, [jumpToPageValue, handlePageChange]);

  // Handle jump to page on Enter key
  const handleJumpKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleJumpToPage();
    }
  }, [handleJumpToPage]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    if (disabled || isLoading || !onPageSizeChange) return;
    onPageSizeChange(newPageSize);
  }, [onPageSizeChange, disabled, isLoading]);

  // Don't render if there's only one page and no other controls
  if (totalPages <= 1 && !showPageSizeSelector && !showTotal) {
    return null;
  }

  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          button: 'px-2 py-1 text-xs',
          input: 'px-2 py-1 text-xs w-12',
          select: 'px-2 py-1 text-xs'
        };
      case 'large':
        return {
          button: 'px-4 py-3 text-base',
          input: 'px-3 py-2 text-base w-16',
          select: 'px-3 py-2 text-base'
        };
      default:
        return {
          button: 'px-3 py-2 text-sm',
          input: 'px-3 py-2 text-sm w-14',
          select: 'px-3 py-2 text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Calculate current items range
  const getCurrentRange = () => {
    if (!totalItems) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  };

  const currentRange = getCurrentRange();

  return (
    <div className={cn('pagination flex flex-col space-y-4', className)}>
      {/* Top section with total and page size selector */}
      {(showTotal || showPageSizeSelector) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          {/* Total items display */}
          {showTotal && totalItems && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentRange ? (
                <>
                  Showing {currentRange.start.toLocaleString()} to {currentRange.end.toLocaleString()} of{' '}
                  {totalItems.toLocaleString()} {defaultLabels.totalItems}
                </>
              ) : (
                <>
                  {totalItems.toLocaleString()} {defaultLabels.totalItems} total
                </>
              )}
            </div>
          )}

          {/* Page size selector */}
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {defaultLabels.pageSize}:
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                disabled={disabled || isLoading}
                className={cn(
                  sizeClasses.select,
                  'border border-gray-300 dark:border-gray-600 rounded-md',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {pageSizeOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main pagination controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Page navigation */}
        <div className="flex items-center justify-center sm:justify-start space-x-1">
          {/* First page button */}
          {showFirstLast && (
            <button
              onClick={() => handlePageChange(1)}
              disabled={disabled || isLoading || currentPage <= 1}
              className={cn(
                sizeClasses.button,
                'font-medium rounded-md border border-gray-300 dark:border-gray-600',
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
              title={defaultLabels.first}
            >
              <span className="sr-only">{defaultLabels.first}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Previous page button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={disabled || isLoading || currentPage <= 1}
            className={cn(
              sizeClasses.button,
              'font-medium rounded-md border border-gray-300 dark:border-gray-600',
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {defaultLabels.previous}
          </button>

          {/* Page number buttons */}
          <div className="hidden sm:flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page as number)}
                    disabled={disabled || isLoading}
                    className={cn(
                      sizeClasses.button,
                      'font-medium rounded-md border',
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    )}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile page info */}
          <div className="sm:hidden flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          {/* Next page button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={disabled || isLoading || currentPage >= totalPages}
            className={cn(
              sizeClasses.button,
              'font-medium rounded-md border border-gray-300 dark:border-gray-600',
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            {defaultLabels.next}
          </button>

          {/* Last page button */}
          {showFirstLast && (
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={disabled || isLoading || currentPage >= totalPages}
              className={cn(
                sizeClasses.button,
                'font-medium rounded-md border border-gray-300 dark:border-gray-600',
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
              title={defaultLabels.last}
            >
              <span className="sr-only">{defaultLabels.last}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Jump to page */}
        {showJumpToPage && totalPages > maxVisiblePages && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {defaultLabels.jumpToPage}:
            </span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPageValue}
              onChange={(e) => setJumpToPageValue(e.target.value)}
              onKeyDown={handleJumpKeyDown}
              disabled={disabled || isLoading}
              placeholder={currentPage.toString()}
              className={cn(
                sizeClasses.input,
                'border border-gray-300 dark:border-gray-600 rounded-md',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <button
              onClick={handleJumpToPage}
              disabled={disabled || isLoading || !jumpToPageValue}
              className={cn(
                sizeClasses.button,
                'font-medium rounded-md',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              Go
            </button>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <svg className="animate-spin h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}
    </div>
  );
});

Pagination.displayName = 'Pagination';