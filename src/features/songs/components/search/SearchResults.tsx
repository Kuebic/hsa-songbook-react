/**
 * @file SearchResults.tsx
 * @description Component for displaying search results with loading states and pagination
 */

import React from 'react';
import { cn } from '../../../../shared/utils/cn';
import type { SearchResult, Song } from '../../types/search.types';
import { SongResultItem } from './components/SongResultItem';
import { Pagination } from './components/Pagination';

export interface SearchResultsProps {
  /** Search results data */
  results?: SearchResult;
  /** Whether the search is loading */
  isLoading?: boolean;
  /** Whether the search is fetching (background refresh) */
  isFetching?: boolean;
  /** Search error */
  error?: Error | null;
  /** CSS class name */
  className?: string;
  /** Whether to show detailed song information */
  showDetails?: boolean;
  /** Song item display variant */
  itemVariant?: 'default' | 'compact' | 'detailed' | 'card';
  /** Whether to show action buttons on song items */
  showItemActions?: boolean;
  /** Callback when a song is selected */
  onSongSelect?: (song: Song) => void;
  /** Callback when song is favorited */
  onToggleFavorite?: (song: Song) => void;
  /** Callback when song is shared */
  onShareSong?: (song: Song) => void;
  /** Callback when song is previewed */
  onPreviewSong?: (song: Song) => void;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback for pagination */
  onPageChange?: (page: number) => void;
  /** Callback for page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Whether to show pagination controls */
  showPagination?: boolean;
  /** Whether to show page size selector */
  showPageSizeSelector?: boolean;
  /** Whether to show total items count */
  showTotal?: boolean;
  /** Whether to show jump to page */
  showJumpToPage?: boolean;
  /** Custom empty state component */
  emptyStateComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Performance info display (development) */
  showPerformanceInfo?: boolean;
}

// Note: SongResultItem and Pagination components are now imported from separate files

/**
 * Search results component with loading states and pagination
 * 
 * Features:
 * - Display search results in a list format
 * - Loading and error states
 * - Pagination support
 * - Empty state handling
 * - Responsive design
 * - Song selection handling
 * 
 * @example
 * ```tsx
 * <SearchResults
 *   results={searchData}
 *   isLoading={isLoading}
 *   error={error}
 *   onSongSelect={handleSongSelect}
 *   onPageChange={handlePageChange}
 *   showDetails={true}
 * />
 * ```
 */
export const SearchResults = React.memo<SearchResultsProps>(({
  results,
  isLoading = false,
  isFetching = false,
  error,
  className,
  showDetails = false,
  itemVariant = 'default',
  showItemActions = false,
  onSongSelect,
  onToggleFavorite,
  onShareSong,
  onPreviewSong,
  onRetry,
  onPageChange,
  onPageSizeChange,
  showPagination = true,
  showPageSizeSelector = false,
  showTotal = false,
  showJumpToPage = false,
  emptyStateComponent,
  errorComponent,
  loadingComponent,
  showPerformanceInfo = false
}) => {

  // Loading state
  if (isLoading && !results) {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }

    return (
      <div className={cn('search-results-loading py-8 text-center', className)}>
        <div className="inline-flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">Searching songs...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }

    return (
      <div className={cn('search-results-error py-8 text-center', className)}>
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Search Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Failed to load search results. Please try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (results && results.songs.length === 0) {
    if (emptyStateComponent) {
      return <div className={className}>{emptyStateComponent}</div>;
    }

    return (
      <div className={cn('search-results-empty py-8 text-center', className)}>
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12a8 8 0 10-2.343 5.657l2.343 2.343-1.414 1.414-2.343-2.343a7.962 7.962 0 01-5.657 2.343z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No songs found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      </div>
    );
  }

  // Results state
  if (!results) {
    return null;
  }

  return (
    <div className={cn('search-results', className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {results.totalCount.toLocaleString()} song{results.totalCount !== 1 ? 's' : ''} found
          </h2>
          {isFetching && (
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Page {results.currentPage} of {results.totalPages}
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {results.songs.map(song => (
          <SongResultItem
            key={song.id || song.slug}
            song={song}
            variant={itemVariant}
            showDetails={showDetails}
            showActions={showItemActions}
            onSelect={onSongSelect}
            onToggleFavorite={onToggleFavorite}
            onShare={onShareSong}
            onPreview={onPreviewSong}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && onPageChange && (
        <Pagination
          currentPage={results.currentPage}
          totalPages={results.totalPages}
          totalItems={results.totalCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          disabled={isFetching}
          showPageSizeSelector={showPageSizeSelector}
          showTotal={showTotal}
          showJumpToPage={showJumpToPage}
          isLoading={isFetching}
        />
      )}

      {/* Performance Info (Development Only) */}
      {showPerformanceInfo && process.env.NODE_ENV === 'development' && results.executionTime && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          Search completed in {results.executionTime.toFixed(1)}ms
        </div>
      )}
    </div>
  );
});

SearchResults.displayName = 'SearchResults';