/**
 * @file SearchFilters.tsx
 * @description Desktop filter panel component for song search
 */

import React, { useCallback } from 'react';
import { cn } from '../../../../shared/utils/cn';
import type { SearchFilters as SearchFiltersType, FilterOption } from '../../types/search.types';
import { useSearchQuery } from '../../hooks/useSearchQuery';
import { SORT_OPTIONS } from '../../types/search.types';
import {
  FilterSection,
  KeyFilter,
  DifficultyFilter,
  TempoRangeFilter,
  ThemeFilter,
  SourceFilter
} from './components';

export interface SearchFiltersProps {
  /** CSS class name */
  className?: string;
  /** Whether the filters are visible */
  isVisible?: boolean;
  /** Initial filters */
  initialFilters?: Partial<SearchFiltersType>;
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchFiltersType) => void;
  /** Whether to show advanced filters */
  showAdvancedFilters?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Available filter options */
  availableFilters?: {
    keys?: FilterOption[];
    difficulties?: FilterOption[];
    themes?: FilterOption[];
    sources?: FilterOption[];
    tempoRange?: [number, number];
  };
}

/**
 * Desktop filter panel for song search
 * 
 * Features:
 * - Multi-select filters for key, difficulty, themes, and sources
 * - Tempo range slider
 * - Sort options
 * - Clear individual filters
 * - Responsive design that collapses on mobile
 * 
 * @example
 * ```tsx
 * <SearchFilters
 *   isVisible={filtersVisible}
 *   onFiltersChange={handleFiltersChange}
 *   availableFilters={availableOptions}
 * />
 * ```
 */
export const SearchFilters = React.memo<SearchFiltersProps>(({
  className,
  isVisible = true,
  initialFilters,
  onFiltersChange,
  showAdvancedFilters = true,
  disabled = false,
  availableFilters = {}
}) => {
  const {
    filters,
    updateFilter,
    clearFilter
  } = useSearchQuery({
    syncWithUrl: true,
    defaultFilters: initialFilters,
    onSearch: onFiltersChange
  });

  /**
   * Clear all filters except core search parameters
   */
  const handleClearAll = useCallback(() => {
    Object.keys(filters).forEach(key => {
      if (key !== 'query' && key !== 'page' && key !== 'limit') {
        clearFilter(key as keyof SearchFiltersType);
      }
    });
  }, [filters, clearFilter]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      'search-filters',
      'bg-white dark:bg-gray-800',
      'border border-gray-200 dark:border-gray-700',
      'rounded-lg p-4 space-y-6',
      'hidden md:block', // Hidden on mobile
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Filters
        </h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          disabled={disabled}
        >
          Clear all
        </button>
      </div>

      {/* Sort By */}
      <FilterSection title="Sort by">
        <select
          value={filters.sortBy || 'relevance'}
          onChange={(e) => updateFilter('sortBy', e.target.value as SearchFiltersType['sortBy'])}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 text-sm',
            'bg-white dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'rounded-md shadow-sm',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Musical Key Filter */}
      <KeyFilter
        value={filters.key}
        onChange={(keys) => updateFilter('key', keys.length > 0 ? keys : undefined)}
        onClear={() => clearFilter('key')}
        availableKeys={availableFilters.keys}
        disabled={disabled}
        isMobile={false}
      />

      {/* Difficulty Filter */}
      <DifficultyFilter
        value={filters.difficulty}
        onChange={(difficulties) => updateFilter('difficulty', difficulties.length > 0 ? difficulties : undefined)}
        onClear={() => clearFilter('difficulty')}
        availableDifficulties={availableFilters.difficulties}
        disabled={disabled}
        isMobile={false}
      />

      {/* Tempo Range */}
      {showAdvancedFilters && (
        <TempoRangeFilter
          value={filters.tempo}
          onChange={(range) => updateFilter('tempo', range)}
          onClear={() => clearFilter('tempo')}
          disabled={disabled}
          isMobile={false}
        />
      )}

      {/* Themes Filter */}
      {showAdvancedFilters && (
        <ThemeFilter
          value={filters.themes}
          onChange={(themes) => updateFilter('themes', themes.length > 0 ? themes : undefined)}
          onClear={() => clearFilter('themes')}
          availableThemes={availableFilters.themes}
          disabled={disabled}
          isMobile={false}
        />
      )}

      {/* Sources Filter */}
      {showAdvancedFilters && (
        <SourceFilter
          value={filters.source}
          onChange={(sources) => updateFilter('source', sources.length > 0 ? sources : undefined)}
          onClear={() => clearFilter('source')}
          availableSources={availableFilters.sources}
          disabled={disabled}
          isMobile={false}
        />
      )}
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';