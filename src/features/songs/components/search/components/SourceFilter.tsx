/**
 * @file SourceFilter.tsx
 * @description Dedicated component for source/songbook filtering
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { FilterSection } from './FilterSection';
import type { FilterOption } from '../../../types/search.types';

export interface SourceFilterProps {
  /** Currently selected sources */
  value?: string[];
  /** Callback when source selection changes */
  onChange?: (sources: string[]) => void;
  /** Callback to clear source filters */
  onClear?: () => void;
  /** Available source options with counts */
  availableSources?: FilterOption[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

const DEFAULT_SOURCES: FilterOption[] = [
  { value: 'Traditional Hymnal', label: 'Traditional Hymnal', count: 0 },
  { value: 'CCLI', label: 'CCLI', count: 0 }
];

/**
 * Reusable source filter component
 */
export const SourceFilter = React.memo<SourceFilterProps>(({
  value = [],
  onChange,
  onClear,
  availableSources,
  disabled = false,
  isMobile = false,
  className
}) => {
  const handleSourceToggle = useCallback((source: string, checked: boolean) => {
    let newSources: string[];
    
    if (checked) {
      newSources = [...value, source];
    } else {
      newSources = value.filter(s => s !== source);
    }
    
    onChange?.(newSources);
  }, [value, onChange]);

  // Get available sources with fallback
  const sourceOptions = availableSources || DEFAULT_SOURCES;
  const hasActiveFilters = value.length > 0;

  return (
    <FilterSection
      title="Sources"
      hasActiveFilters={hasActiveFilters}
      onClear={onClear}
      disabled={disabled}
      className={className}
    >
      <div className="space-y-3">
        {sourceOptions.map(source => (
          <label
            key={source.value}
            className={cn(
              'cursor-pointer',
              isMobile
                ? 'flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg active:scale-95 transition-all duration-150'
                : 'flex items-center space-x-2',
              isMobile && value.includes(source.value)
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
                    checked={value.includes(source.value)}
                    onChange={(e) => handleSourceToggle(source.value, e.target.checked)}
                    disabled={disabled}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    {source.label}
                  </span>
                </div>
                {source.count > 0 && (
                  <span className="text-sm text-gray-500">({source.count})</span>
                )}
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={value.includes(source.value)}
                  onChange={(e) => handleSourceToggle(source.value, e.target.checked)}
                  disabled={disabled}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {source.label}
                  {source.count > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({source.count})</span>
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

SourceFilter.displayName = 'SourceFilter';