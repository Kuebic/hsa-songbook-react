/**
 * @file SearchSkeleton.tsx
 * @description Loading skeleton component for search results
 */

import React from 'react';
import { cn } from '../../../../shared/utils/cn';

export interface SearchSkeletonProps {
  /** CSS class name */
  className?: string;
  /** Number of skeleton items to show */
  count?: number;
  /** Whether to show the search header skeleton */
  showHeader?: boolean;
  /** Whether to show detailed skeleton (with more lines) */
  showDetails?: boolean;
}

/**
 * Individual skeleton item for a song result
 */
const SkeletonItem = React.memo<{ showDetails: boolean }>(({ showDetails }) => (
  <div className="p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        {/* Title and Artist */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>

        {/* Key and Difficulty badges */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>

        {/* Themes */}
        <div className="flex flex-wrap gap-1 mb-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        </div>

        {/* Lyrics preview (if detailed) */}
        {showDetails && (
          <div className="space-y-1 mt-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        )}
      </div>

      {/* Metadata on the right */}
      <div className="flex flex-col items-end space-y-1 ml-4">
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  </div>
));

SkeletonItem.displayName = 'SkeletonItem';

/**
 * Loading skeleton for search results
 * 
 * Displays animated placeholder content while search results are loading.
 * Mimics the structure of actual search results for better perceived performance.
 * 
 * @example
 * ```tsx
 * <SearchSkeleton
 *   count={5}
 *   showHeader={true}
 *   showDetails={true}
 * />
 * ```
 */
export const SearchSkeleton = React.memo<SearchSkeletonProps>(({
  className,
  count = 5,
  showHeader = true,
  showDetails = false
}) => {
  return (
    <div className={cn('search-skeleton', className)}>
      {/* Header Skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32" />
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-spin" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      )}

      {/* Results Skeleton */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {Array.from({ length: count }, (_, index) => (
          <SkeletonItem key={index} showDetails={showDetails} />
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center space-x-2 py-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-8" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-6" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  );
});

SearchSkeleton.displayName = 'SearchSkeleton';

/**
 * Compact skeleton for search input area
 */
export const SearchInputSkeleton = React.memo<{
  className?: string;
}>(({ className }) => (
  <div className={cn('search-input-skeleton animate-pulse', className)}>
    <div className="relative">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600" />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    </div>
  </div>
));

SearchInputSkeleton.displayName = 'SearchInputSkeleton';

/**
 * Skeleton for filter panel
 */
export const SearchFiltersSkeleton = React.memo<{
  className?: string;
}>(({ className }) => (
  <div className={cn(
    'search-filters-skeleton animate-pulse',
    'bg-white dark:bg-gray-800',
    'border border-gray-200 dark:border-gray-700',
    'rounded-lg p-4 space-y-6',
    className
  )}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
    </div>

    {/* Sort by */}
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" />
    </div>

    {/* Key filter */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" />
        ))}
      </div>
    </div>

    {/* Other filters */}
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));

SearchFiltersSkeleton.displayName = 'SearchFiltersSkeleton';