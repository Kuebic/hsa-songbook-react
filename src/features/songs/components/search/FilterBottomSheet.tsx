/**
 * @file FilterBottomSheet.tsx
 * @description Mobile bottom sheet component for search filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../shared/utils/cn';
import type { SearchFilters as SearchFiltersType, FilterOption } from '../../types/search.types';
import { useSearchQuery } from '../../hooks/useSearchQuery';
import { SORT_OPTIONS } from '../../types/search.types';
import { useDragHandler } from './hooks';
import {
  FilterSection,
  FilterActions,
  KeyFilter,
  DifficultyFilter,
  TempoRangeFilter,
  ThemeFilter,
  SourceFilter
} from './components';

export interface FilterBottomSheetProps {
  /** Whether the bottom sheet is visible */
  isOpen?: boolean;
  /** Callback when the sheet should be closed */
  onClose?: () => void;
  /** Initial filters */
  initialFilters?: Partial<SearchFiltersType>;
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchFiltersType) => void;
  /** Available filter options */
  availableFilters?: {
    keys?: FilterOption[];
    difficulties?: FilterOption[];
    themes?: FilterOption[];
    sources?: FilterOption[];
    tempoRange?: [number, number];
  };
  /** Whether to show advanced filters */
  showAdvancedFilters?: boolean;
  /** Custom portal container */
  portalContainer?: HTMLElement;
}

/**
 * Mobile bottom sheet for search filters
 * 
 * Features:
 * - Slide-up animation from bottom
 * - Touch gestures for dragging to close
 * - Backdrop overlay with click-to-close
 * - Full mobile-optimized filter interface
 * - Apply/Reset actions
 * 
 * @example
 * ```tsx
 * <FilterBottomSheet
 *   isOpen={isFiltersOpen}
 *   onClose={closeFilters}
 *   onFiltersChange={handleFiltersChange}
 *   availableFilters={availableOptions}
 * />
 * ```
 */
export const FilterBottomSheet = React.memo<FilterBottomSheetProps>(({
  isOpen = false,
  onClose,
  initialFilters,
  onFiltersChange,
  availableFilters = {},
  showAdvancedFilters = true,
  portalContainer
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    filters,
    updateFilter,
    clearFilter,
    clearFilters
  } = useSearchQuery({
    syncWithUrl: false, // Don't sync URL in bottom sheet
    defaultFilters: initialFilters,
    onSearch: onFiltersChange
  });

  const { dragY, isDragging, handleTouchStart, handleTouchMove, handleTouchEnd, resetDrag } = useDragHandler({
    onClose
  });

  /**
   * Handle opening animation and body scroll lock
   */
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = '';
      resetDrag();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, resetDrag]);

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [onClose]);

  /**
   * Apply filters and close
   */
  const handleApply = useCallback(() => {
    onFiltersChange?.(filters);
    onClose?.();
  }, [filters, onFiltersChange, onClose]);

  /**
   * Reset all filters
   */
  const handleReset = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  if (!isOpen && !isAnimating) {
    return null;
  }

  const container = portalContainer || document.body;

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'w-full bg-white dark:bg-gray-900',
          'rounded-t-2xl shadow-2xl',
          'max-h-[85vh] flex flex-col',
          'transition-transform duration-300 ease-out',
          isOpen && !isDragging && dragY === 0 ? 'translate-y-0' : 'translate-y-full'
        )}
        style={isDragging ? { transform: `translateY(${dragY}px)` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Sort By */}
          <FilterSection title="Sort by">
            <select
              value={filters.sortBy || 'relevance'}
              onChange={(e) => updateFilter('sortBy', e.target.value as SearchFiltersType['sortBy'])}
              className={cn(
                'w-full px-4 py-3 text-base',
                'bg-white dark:bg-gray-800',
                'border border-gray-300 dark:border-gray-600',
                'rounded-lg shadow-sm',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
            isMobile={true}
          />

          {/* Difficulty Filter */}
          <DifficultyFilter
            value={filters.difficulty}
            onChange={(difficulties) => updateFilter('difficulty', difficulties.length > 0 ? difficulties : undefined)}
            onClear={() => clearFilter('difficulty')}
            availableDifficulties={availableFilters.difficulties}
            isMobile={true}
          />

          {/* Tempo Range */}
          {showAdvancedFilters && (
            <TempoRangeFilter
              value={filters.tempo}
              onChange={(range) => updateFilter('tempo', range)}
              onClear={() => clearFilter('tempo')}
              isMobile={true}
            />
          )}

          {/* Themes Filter */}
          {showAdvancedFilters && (
            <ThemeFilter
              value={filters.themes}
              onChange={(themes) => updateFilter('themes', themes.length > 0 ? themes : undefined)}
              onClear={() => clearFilter('themes')}
              availableThemes={availableFilters.themes}
              isMobile={true}
            />
          )}

          {/* Sources Filter */}
          {showAdvancedFilters && (
            <SourceFilter
              value={filters.source}
              onChange={(sources) => updateFilter('source', sources.length > 0 ? sources : undefined)}
              onClear={() => clearFilter('source')}
              availableSources={availableFilters.sources}
              isMobile={true}
            />
          )}
        </div>

        {/* Actions */}
        <FilterActions
          onApply={handleApply}
          onReset={handleReset}
          isMobile={true}
        />
      </div>
    </div>
  );

  return createPortal(content, container);
});

FilterBottomSheet.displayName = 'FilterBottomSheet';