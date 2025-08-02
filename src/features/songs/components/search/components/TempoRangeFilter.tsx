/**
 * @file TempoRangeFilter.tsx
 * @description Dedicated component for tempo range filtering
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { FilterSection } from './FilterSection';

export interface TempoRangeFilterProps {
  /** Current tempo range [min, max] */
  value?: [number, number];
  /** Callback when tempo range changes */
  onChange?: (range: [number, number]) => void;
  /** Callback to clear the tempo filter */
  onClear?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Reusable tempo range filter component
 */
export const TempoRangeFilter = React.memo<TempoRangeFilterProps>(({
  value = [60, 180],
  onChange,
  onClear,
  disabled = false,
  isMobile = false,
  className
}) => {
  const handleTempoChange = useCallback((type: 'min' | 'max', newValue: number) => {
    const newRange: [number, number] = type === 'min' 
      ? [newValue, value[1]]
      : [value[0], newValue];
    
    onChange?.(newRange);
  }, [value, onChange]);

  const hasActiveFilter = value[0] !== 60 || value[1] !== 180;

  return (
    <FilterSection
      title="Tempo (BPM)"
      hasActiveFilters={hasActiveFilter}
      onClear={onClear}
      disabled={disabled}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Min
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={value[0]}
              onChange={(e) => handleTempoChange('min', parseInt(e.target.value) || 30)}
              disabled={disabled}
              className={cn(
                'w-full text-center',
                isMobile 
                  ? 'px-3 py-2 text-base'
                  : 'px-2 py-1 text-sm',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600',
                'rounded-lg',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>
          <span className={cn(
            'text-gray-400',
            isMobile ? 'pt-5' : 'pt-3'
          )}>
            -
          </span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              Max
            </label>
            <input
              type="number"
              min="30"
              max="300"
              value={value[1]}
              onChange={(e) => handleTempoChange('max', parseInt(e.target.value) || 300)}
              disabled={disabled}
              className={cn(
                'w-full text-center',
                isMobile 
                  ? 'px-3 py-2 text-base'
                  : 'px-2 py-1 text-sm',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600',
                'rounded-lg',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
          </div>
        </div>
        <div className={cn(
          'text-gray-500 dark:text-gray-400 text-center',
          isMobile ? 'text-sm' : 'text-xs'
        )}>
          {value[0]} - {value[1]} BPM
        </div>
      </div>
    </FilterSection>
  );
});

TempoRangeFilter.displayName = 'TempoRangeFilter';