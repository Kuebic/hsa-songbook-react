/**
 * @file SongSearch.tsx
 * @description Main song search component with debounced input and responsive design
 */

import React, { useState, useRef } from 'react';
import { cn } from '../../../../shared/utils/cn';
import type { SearchComponentProps } from '../../types/search.types';
import { useSearchQuery } from '../../hooks/useSearchQuery';
import { hasActiveFilters, getActiveFilterCount } from '../../utils/searchUtils';

export interface SongSearchProps extends SearchComponentProps {
  /** Whether to show the filter button */
  showFilterButton?: boolean;
  /** Callback when filter button is clicked */
  onFilterClick?: () => void;
  /** Whether filters are currently visible */
  areFiltersVisible?: boolean;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
  /** Custom clear icon */
  clearIcon?: React.ReactNode;
}

/**
 * Main song search component with debounced input
 * 
 * Features:
 * - 300ms debounced search input
 * - Responsive design with mobile optimization
 * - Filter button with active count indicator
 * - Clear search functionality
 * - Keyboard shortcuts and accessibility
 * 
 * @example
 * ```tsx
 * <SongSearch
 *   placeholder="Search songs..."
 *   onSearch={handleSearch}
 *   showFilterButton={true}
 *   onFilterClick={openFilters}
 * />
 * ```
 */
export const SongSearch = React.memo<SongSearchProps>(({
  className,
  placeholder = 'Search songs...',
  disabled = false,
  onSearch,
  onFiltersChange,
  initialFilters,
  showAdvancedFilters = true,
  showFilterButton = true,
  onFilterClick,
  areFiltersVisible = false,
  searchIcon,
  clearIcon
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Use the search query hook for state management
  const {
    filters,
    setQuery,
    clearFilters
  } = useSearchQuery({
    debounceDelay: 300, // Required 300ms debounce
    syncWithUrl: true,
    defaultFilters: initialFilters,
    onSearch: (searchFilters) => {
      if (onSearch) {
        onSearch(searchFilters);
      }
      if (onFiltersChange) {
        onFiltersChange(searchFilters);
      }
    }
  });
  
  // Track if there are active filters
  const hasFilters = hasActiveFilters(filters);
  const filterCount = getActiveFilterCount(filters);
  
  /**
   * Handle input change with debouncing
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value); // This will automatically debounce and trigger search
  };
  
  /**
   * Handle clear search
   */
  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  /**
   * Handle clear all filters
   */
  const handleClearAll = () => {
    clearFilters();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  /**
   * Handle input focus
   */
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  /**
   * Handle input blur
   */
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (filters.query) {
        handleClear();
      } else if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };
  
  // Default icons
  const defaultSearchIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
  
  const defaultClearIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
  
  return (
    <div className={cn('song-search w-full', className)}>
      {/* Search Input Container */}
      <div className="relative">
        <div
          className={cn(
            'relative flex items-center',
            'border rounded-lg transition-all duration-200',
            'bg-white dark:bg-gray-800',
            isFocused
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Search Icon */}
          <div className="absolute left-3 text-gray-400 dark:text-gray-500">
            {searchIcon || defaultSearchIcon}
          </div>
          
          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={filters.query || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full pl-10 pr-20 py-3 md:py-2',
              'text-base md:text-sm',
              'bg-transparent',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none',
              'disabled:cursor-not-allowed'
            )}
            aria-label="Search songs"
            aria-describedby="search-help"
          />
          
          {/* Right Side Controls */}
          <div className="absolute right-2 flex items-center gap-1">
            {/* Clear Button */}
            {filters.query && (
              <button
                onClick={handleClear}
                disabled={disabled}
                className={cn(
                  'p-1.5 rounded-md',
                  'text-gray-400 hover:text-gray-600',
                  'dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label="Clear search"
              >
                {clearIcon || defaultClearIcon}
              </button>
            )}
            
            {/* Filter Button (Mobile + Desktop) */}
            {showFilterButton && showAdvancedFilters && (
              <button
                onClick={onFilterClick}
                disabled={disabled}
                className={cn(
                  'relative p-1.5 rounded-md',
                  'text-gray-400 hover:text-gray-600',
                  'dark:text-gray-500 dark:hover:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  areFiltersVisible && 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'
                )}
                aria-label={`${areFiltersVisible ? 'Hide' : 'Show'} filters${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                
                {/* Filter Count Badge */}
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {filterCount > 9 ? '9+' : filterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Clear All Filters Button */}
        {hasFilters && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleClearAll}
              disabled={disabled}
              className={cn(
                'text-sm text-gray-500 hover:text-gray-700',
                'dark:text-gray-400 dark:hover:text-gray-200',
                'underline transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      
      {/* Hidden help text for screen readers */}
      <div id="search-help" className="sr-only">
        Search for songs by title, artist, or lyrics. Use filters to narrow results by key, difficulty, or themes.
      </div>
    </div>
  );
});

SongSearch.displayName = 'SongSearch';