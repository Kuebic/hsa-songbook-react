/**
 * @file SongResultItem.tsx
 * @description Individual song result item component with enhanced features and variants
 */

import React from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { Song } from '../../../types/search.types';

export interface SongResultItemProps {
  /** Song data to display */
  song: Song;
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed' | 'card';
  /** Whether to show detailed song information */
  showDetails?: boolean;
  /** Whether the item is currently loading */
  isLoading?: boolean;
  /** Whether the item is selected/active */
  isSelected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Callback when the song is selected */
  onSelect?: (song: Song) => void;
  /** Callback when favorite button is clicked */
  onToggleFavorite?: (song: Song) => void;
  /** Callback when share button is clicked */
  onShare?: (song: Song) => void;
  /** Callback when preview button is clicked */
  onPreview?: (song: Song) => void;
  /** Custom action buttons */
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (song: Song) => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Custom content to display in the metadata section */
  customMetadata?: React.ReactNode;
}

/**
 * Individual song result item component
 * 
 * Features:
 * - Multiple display variants (default, compact, detailed, card)
 * - Keyboard navigation support
 * - Accessibility improvements
 * - Action buttons (favorite, share, preview)
 * - Loading and selection states
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <SongResultItem
 *   song={songData}
 *   variant="detailed"
 *   showDetails={true}
 *   showActions={true}
 *   onSelect={handleSongSelect}
 *   onToggleFavorite={handleFavorite}
 *   onShare={handleShare}
 * />
 * ```
 */
export const SongResultItem = React.memo<SongResultItemProps>(({
  song,
  variant = 'default',
  showDetails = false,
  isLoading = false,
  isSelected = false,
  disabled = false,
  className,
  onSelect,
  onToggleFavorite,
  onShare,
  onPreview,
  actions = [],
  showActions = false,
  customMetadata
}) => {
  const handleClick = () => {
    if (disabled || isLoading) return;
    if (onSelect) {
      onSelect(song);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || isLoading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleActionClick = (actionFn: (song: Song) => void, event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled || isLoading) return;
    actionFn(song);
  };

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'py-2 px-3';
      case 'detailed':
        return 'p-6';
      case 'card':
        return 'p-4 m-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm';
      default:
        return 'p-4';
    }
  };

  // Get difficulty color classes
  const getDifficultyClasses = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className={cn(
        'song-result-item relative',
        getVariantClasses(),
        variant !== 'card' && 'border-b border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        'transition-colors duration-150',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
        isLoading && 'opacity-60 pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed',
        onSelect && !disabled && !isLoading && 'cursor-pointer focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800/50',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect && !disabled && !isLoading ? 0 : -1}
      role={onSelect ? 'button' : undefined}
      aria-label={onSelect ? `Select song ${song.title}` : undefined}
      aria-selected={isSelected}
      aria-disabled={disabled || isLoading}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Artist */}
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={cn(
              'font-semibold text-gray-900 dark:text-gray-100 truncate',
              variant === 'compact' ? 'text-base' : 'text-lg'
            )}>
              {song.title}
            </h3>
            {song.artist && (
              <span className={cn(
                'text-gray-500 dark:text-gray-400 truncate',
                variant === 'compact' ? 'text-xs' : 'text-sm'
              )}>
                by {song.artist}
              </span>
            )}
          </div>

          {/* Key and Difficulty */}
          {variant !== 'compact' && (
            <div className="flex items-center space-x-4 mb-2">
              {song.key && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                  Key: {song.key}
                </span>
              )}
              {song.difficulty && (
                <span className={cn(
                  'inline-flex items-center px-2 py-1 text-xs font-medium rounded capitalize',
                  getDifficultyClasses(song.difficulty)
                )}>
                  {song.difficulty}
                </span>
              )}
              {song.tempo && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {song.tempo} BPM
                </span>
              )}
            </div>
          )}

          {/* Themes */}
          {(variant === 'detailed' || showDetails) && song.themes && song.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {song.themes.map(theme => (
                <span
                  key={theme}
                  className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded capitalize"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Lyrics Preview */}
          {(variant === 'detailed' || showDetails) && song.lyrics && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
              {song.lyrics.length > 100 ? `${song.lyrics.substring(0, 100)}...` : song.lyrics}
            </p>
          )}

          {/* Compact variant key/difficulty */}
          {variant === 'compact' && (
            <div className="flex items-center space-x-2 mt-1">
              {song.key && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {song.key}
                </span>
              )}
              {song.difficulty && (
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {song.difficulty}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Metadata and Actions */}
        <div className="flex flex-col items-end space-y-1 ml-4">
          {/* Ratings */}
          {song.metadata?.ratings && variant !== 'compact' && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {song.metadata.ratings.average.toFixed(1)} ({song.metadata.ratings.count})
              </span>
            </div>
          )}

          {/* Views */}
          {song.metadata?.views && variant !== 'compact' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {song.metadata.views.toLocaleString()} views
            </span>
          )}

          {/* Source */}
          {song.source && variant !== 'compact' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {song.source}
            </span>
          )}

          {/* Custom metadata */}
          {customMetadata}

          {/* Action Buttons */}
          {showActions && !disabled && !isLoading && (
            <div className="flex items-center space-x-1 mt-2">
              {onToggleFavorite && (
                <button
                  onClick={(e) => handleActionClick(onToggleFavorite, e)}
                  className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Toggle favorite"
                  aria-label="Toggle favorite"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {onShare && (
                <button
                  onClick={(e) => handleActionClick(onShare, e)}
                  className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Share song"
                  aria-label="Share song"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              )}

              {onPreview && (
                <button
                  onClick={(e) => handleActionClick(onPreview, e)}
                  className="p-1 rounded-md text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Preview song"
                  aria-label="Preview song"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}

              {/* Custom Actions */}
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => handleActionClick(action.onClick, e)}
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    action.variant === 'primary' && 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    action.variant === 'secondary' && 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700',
                    (!action.variant || action.variant === 'ghost') && 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  title={action.label}
                  aria-label={action.label}
                >
                  {action.icon || (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SongResultItem.displayName = 'SongResultItem';