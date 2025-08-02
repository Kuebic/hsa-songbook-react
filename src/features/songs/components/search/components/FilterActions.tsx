/**
 * @file FilterActions.tsx
 * @description Reusable filter action buttons (Apply/Reset)
 */

import React from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface FilterActionsProps {
  /** Callback for apply action */
  onApply?: () => void;
  /** Callback for reset action */
  onReset?: () => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Apply button text */
  applyText?: string;
  /** Reset button text */
  resetText?: string;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable filter action buttons component
 */
export const FilterActions = React.memo<FilterActionsProps>(({
  onApply,
  onReset,
  disabled = false,
  applyText = 'Apply Filters',
  resetText = 'Reset',
  isMobile = false,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center space-x-3',
      isMobile
        ? 'p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
        : 'pt-4',
      className
    )}>
      <button
        onClick={onReset}
        disabled={disabled}
        className={cn(
          'flex-1 font-medium rounded-lg transition-all duration-150',
          isMobile
            ? 'px-4 py-3 text-base'
            : 'px-3 py-2 text-sm',
          'text-gray-700 dark:text-gray-300',
          'border border-gray-300 dark:border-gray-600',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          isMobile && 'active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {resetText}
      </button>
      
      <button
        onClick={onApply}
        disabled={disabled}
        className={cn(
          'flex-1 font-medium rounded-lg transition-all duration-150',
          isMobile
            ? 'px-4 py-3 text-base'
            : 'px-3 py-2 text-sm',
          'text-white bg-blue-600 hover:bg-blue-700',
          isMobile && 'active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-600'
        )}
      >
        {applyText}
      </button>
    </div>
  );
});

FilterActions.displayName = 'FilterActions';