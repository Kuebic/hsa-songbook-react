/**
 * @file DifficultyFilter.tsx
 * @description Dedicated component for difficulty level filtering
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { FilterSection } from './FilterSection';
import type { FilterOption } from '../../../types/search.types';

export interface DifficultyFilterProps {
  /** Currently selected difficulties */
  value?: ('beginner' | 'intermediate' | 'advanced')[];
  /** Callback when difficulty selection changes */
  onChange?: (difficulties: ('beginner' | 'intermediate' | 'advanced')[]) => void;
  /** Callback to clear difficulty filters */
  onClear?: () => void;
  /** Available difficulty options with counts */
  availableDifficulties?: FilterOption[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

const DEFAULT_DIFFICULTIES: FilterOption[] = [
  { value: 'beginner', label: 'Beginner', count: 0 },
  { value: 'intermediate', label: 'Intermediate', count: 0 },
  { value: 'advanced', label: 'Advanced', count: 0 }
];

/**
 * Reusable difficulty filter component
 */
export const DifficultyFilter = React.memo<DifficultyFilterProps>(({
  value = [],
  onChange,
  onClear,
  availableDifficulties,
  disabled = false,
  isMobile = false,
  className
}) => {
  const handleDifficultyToggle = useCallback((difficulty: string, checked: boolean) => {
    let newDifficulties: ('beginner' | 'intermediate' | 'advanced')[];
    
    if (checked) {
      newDifficulties = [...value, difficulty as 'beginner' | 'intermediate' | 'advanced'];
    } else {
      newDifficulties = value.filter(d => d !== difficulty);
    }
    
    onChange?.(newDifficulties);
  }, [value, onChange]);

  // Get available difficulties with fallback
  const difficultyOptions = availableDifficulties || DEFAULT_DIFFICULTIES;
  const hasActiveFilters = value.length > 0;

  return (
    <FilterSection
      title="Difficulty"
      hasActiveFilters={hasActiveFilters}
      onClear={onClear}
      disabled={disabled}
      className={className}
    >
      <div className="space-y-3">
        {difficultyOptions.map(difficulty => (
          <label
            key={difficulty.value}
            className={cn(
              'cursor-pointer',
              isMobile
                ? 'flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg active:scale-95 transition-all duration-150'
                : 'flex items-center space-x-2',
              isMobile && value.includes(difficulty.value as 'beginner' | 'intermediate' | 'advanced')
                ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                : isMobile
                ? 'bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700'
                : '',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isMobile ? (
              <>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value.includes(difficulty.value as 'beginner' | 'intermediate' | 'advanced')}
                    onChange={(e) => handleDifficultyToggle(difficulty.value, e.target.checked)}
                    disabled={disabled}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    {difficulty.label}
                  </span>
                </div>
                {difficulty.count > 0 && (
                  <span className="text-sm text-gray-500">({difficulty.count})</span>
                )}
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={value.includes(difficulty.value as 'beginner' | 'intermediate' | 'advanced')}
                  onChange={(e) => handleDifficultyToggle(difficulty.value, e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {difficulty.label}
                  {difficulty.count > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({difficulty.count})</span>
                  )}
                </span>
              </>
            )}
          </label>
        ))}
      </div>
    </FilterSection>
  );
});

DifficultyFilter.displayName = 'DifficultyFilter';