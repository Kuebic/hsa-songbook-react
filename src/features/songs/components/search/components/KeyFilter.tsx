/**
 * @file KeyFilter.tsx
 * @description Dedicated component for musical key filtering
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { FilterSection } from './FilterSection';
import { MUSICAL_KEYS } from '../../../types/search.types';
import type { FilterOption } from '../../../types/search.types';

export interface KeyFilterProps {
  /** Currently selected keys */
  value?: string[];
  /** Callback when key selection changes */
  onChange?: (keys: string[]) => void;
  /** Callback to clear key filters */
  onClear?: () => void;
  /** Available key options with counts */
  availableKeys?: FilterOption[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable musical key filter component
 */
export const KeyFilter = React.memo<KeyFilterProps>(({
  value = [],
  onChange,
  onClear,
  availableKeys,
  disabled = false,
  isMobile = false,
  className
}) => {
  const handleKeyToggle = useCallback((key: string, checked: boolean) => {
    let newKeys: string[];
    
    if (checked) {
      newKeys = [...value, key];
    } else {
      newKeys = value.filter(k => k !== key);
    }
    
    onChange?.(newKeys);
  }, [value, onChange]);

  // Get available keys with fallback to all musical keys
  const keyOptions = availableKeys || MUSICAL_KEYS.map(key => ({ 
    value: key, 
    label: key, 
    count: 0 
  }));

  const hasActiveFilters = value.length > 0;
  const gridCols = isMobile ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <FilterSection
      title="Key"
      hasActiveFilters={hasActiveFilters}
      onClear={onClear}
      disabled={disabled}
      className={className}
    >
      <div className={cn('grid gap-2', gridCols)}>
        {keyOptions.map(keyOption => (
          <label
            key={keyOption.value}
            className={cn(
              'flex items-center justify-center font-medium cursor-pointer',
              'border border-gray-300 dark:border-gray-600 rounded-lg',
              'transition-all duration-150',
              isMobile 
                ? 'p-3 text-sm active:scale-95'
                : 'p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
              value.includes(keyOption.value)
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              checked={value.includes(keyOption.value)}
              onChange={(e) => handleKeyToggle(keyOption.value, e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <span>{keyOption.label}</span>
            {!isMobile && keyOption.count > 0 && (
              <span className="ml-1 text-xs opacity-75">({keyOption.count})</span>
            )}
          </label>
        ))}
      </div>
    </FilterSection>
  );
});

KeyFilter.displayName = 'KeyFilter';