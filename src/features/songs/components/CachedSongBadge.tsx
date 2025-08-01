/**
 * @file CachedSongBadge.tsx
 * @description Badge component to indicate cached/offline availability of songs
 */

import React from 'react';
import { cn } from '../../../shared/utils/cn';

export interface CachedSongBadgeProps {
  /** Whether the song is cached */
  isCached: boolean;
  /** CSS class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label */
  showLabel?: boolean;
  /** Tooltip text */
  title?: string;
}

/**
 * Badge to indicate song offline availability
 */
export const CachedSongBadge = React.memo<CachedSongBadgeProps>(({
  isCached,
  className,
  size = 'md',
  showLabel = false,
  title
}) => {
  if (!isCached) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 font-medium rounded-full',
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'border border-green-200 dark:border-green-700',
        sizeClasses[size],
        className
      )}
      title={title || 'Available offline'}
      aria-label="Available offline"
    >
      <svg
        className={cn('flex-shrink-0', iconSizes[size])}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      
      {showLabel && (
        <span>Cached</span>
      )}
    </span>
  );
});

CachedSongBadge.displayName = 'CachedSongBadge';

/**
 * Simple offline availability indicator
 */
export const OfflineAvailableBadge = React.memo<{
  className?: string;
}>(({ className }) => (
  <div
    className={cn(
      'inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium',
      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      'border border-blue-200 dark:border-blue-800 rounded-md',
      className
    )}
    title="Available when offline"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
    <span>Offline</span>
  </div>
));

OfflineAvailableBadge.displayName = 'OfflineAvailableBadge';