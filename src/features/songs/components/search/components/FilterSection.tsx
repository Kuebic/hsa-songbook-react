/**
 * @file FilterSection.tsx
 * @description Reusable filter section component with consistent styling
 */

import React from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface FilterSectionProps {
  /** Section title */
  title: string;
  /** Whether there are active filters to show clear button */
  hasActiveFilters?: boolean;
  /** Callback to clear filters in this section */
  onClear?: () => void;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Section content */
  children: React.ReactNode;
}

/**
 * Reusable filter section with consistent header and clear functionality
 */
export const FilterSection = React.memo<FilterSectionProps>(({
  title,
  hasActiveFilters = false,
  onClear,
  disabled = false,
  className,
  children
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </label>
        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            disabled={disabled}
            className={cn(
              'text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Section Content */}
      <div className={cn(disabled && 'opacity-50 pointer-events-none')}>
        {children}
      </div>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';