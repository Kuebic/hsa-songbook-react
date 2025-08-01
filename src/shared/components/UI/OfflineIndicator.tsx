/**
 * @file OfflineIndicator.tsx
 * @description Component for displaying network status and offline indicators
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export interface OfflineIndicatorProps {
  /** CSS class name */
  className?: string;
  /** Show detailed status message */
  showDetails?: boolean;
  /** Position of the indicator */
  position?: 'top' | 'bottom' | 'inline';
  /** Whether to auto-hide when online */
  autoHide?: boolean;
}

/**
 * Network status indicator component
 */
export const OfflineIndicator = React.memo<OfflineIndicatorProps>(({
  className,
  showDetails = false,
  position = 'top',
  autoHide = false
}) => {
  const {
    effectiveStatus,
    message,
    connectionType,
    lastOnlineTime,
    hasOfflineData,
  } = useOfflineStatus();

  // Auto-hide when online if enabled
  if (autoHide && effectiveStatus === 'online') {
    return null;
  }

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'online':
        return 'bg-green-500 text-white';
      case 'limited':
        return 'bg-yellow-500 text-white';
      case 'offline':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = () => {
    switch (effectiveStatus) {
      case 'online':
        return '🟢';
      case 'limited':
        return '🟡';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatLastOnlineTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    inline: 'relative',
  };

  return (
    <div
      className={cn(
        'px-4 py-2 text-sm font-medium',
        'transition-all duration-300 ease-in-out',
        getStatusColor(),
        positionClasses[position],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg" aria-hidden="true">
          {getStatusIcon()}
        </span>
        <span>{message}</span>
        
        {showDetails && (
          <div className="hidden sm:flex items-center space-x-4 ml-4 text-xs opacity-90">
            {connectionType && (
              <span>
                Connection: {connectionType.toUpperCase()}
              </span>
            )}
            
            {effectiveStatus === 'offline' && lastOnlineTime && (
              <span>
                Last online: {formatLastOnlineTime(lastOnlineTime)}
              </span>
            )}
            
            {effectiveStatus === 'offline' && hasOfflineData && (
              <span>
                ✓ Offline data available
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Mobile details */}
      {showDetails && (
        <div className="sm:hidden mt-1 text-center text-xs opacity-90">
          {effectiveStatus === 'offline' && hasOfflineData && (
            <div>Offline content available</div>
          )}
        </div>
      )}
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

/**
 * Compact inline status indicator
 */
export const StatusBadge = React.memo<{
  className?: string;
  showText?: boolean;
}>(({ className, showText = true }) => {
  const { effectiveStatus, message } = useOfflineStatus();

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
        getStatusColor(),
        className
      )}
      title={message}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {showText && <span>{effectiveStatus}</span>}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';