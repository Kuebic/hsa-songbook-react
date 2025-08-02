/**
 * @file ThemeFilter.tsx
 * @description Dedicated component for theme/genre filtering
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { FilterSection } from './FilterSection';
import type { FilterOption } from '../../../types/search.types';

export interface ThemeFilterProps {
  /** Currently selected themes */
  value?: string[];
  /** Callback when theme selection changes */
  onChange?: (themes: string[]) => void;
  /** Callback to clear theme filters */
  onClear?: () => void;
  /** Available theme options with counts */
  availableThemes?: FilterOption[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom CSS classes */
  className?: string;
}

const DEFAULT_THEMES: FilterOption[] = [
  { value: 'hymn', label: 'Hymn', count: 0 },
  { value: 'worship', label: 'Worship', count: 0 },
  { value: 'contemporary', label: 'Contemporary', count: 0 },
  { value: 'praise', label: 'Praise', count: 0 }
];

/**
 * Reusable theme filter component
 */
export const ThemeFilter = React.memo<ThemeFilterProps>(({
  value = [],
  onChange,
  onClear,
  availableThemes,
  disabled = false,
  isMobile = false,
  className
}) => {
  const handleThemeToggle = useCallback((theme: string, checked: boolean) => {
    let newThemes: string[];
    
    if (checked) {
      newThemes = [...value, theme];
    } else {
      newThemes = value.filter(t => t !== theme);
    }
    
    onChange?.(newThemes);
  }, [value, onChange]);

  // Get available themes with fallback
  const themeOptions = availableThemes || DEFAULT_THEMES;
  const hasActiveFilters = value.length > 0;

  return (
    <FilterSection
      title="Themes"
      hasActiveFilters={hasActiveFilters}
      onClear={onClear}
      disabled={disabled}
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        {themeOptions.map(theme => (
          <label
            key={theme.value}
            className={cn(
              'inline-flex items-center font-medium rounded-full cursor-pointer',
              'border transition-all duration-150',
              isMobile
                ? 'px-4 py-2 text-sm active:scale-95'
                : 'px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
              value.includes(theme.value)
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                : 'bg-white border-gray-300 text-gray-700 active:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:active:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              checked={value.includes(theme.value)}
              onChange={(e) => handleThemeToggle(theme.value, e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <span>{theme.label}</span>
            {theme.count > 0 && (
              <span className="ml-1 text-xs opacity-75">({theme.count})</span>
            )}
          </label>
        ))}
      </div>
    </FilterSection>
  );
});

ThemeFilter.displayName = 'ThemeFilter';