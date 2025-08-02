/**
 * @file OfflineIndicator.tsx
 * @description Component for displaying network status and offline indicators
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { 
  StatusCard,
  OfflineIcon,
  StatusCaption,
  StatusDescription 
} from './index';

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

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    switch (effectiveStatus) {
      case 'online':
        return 'success';
      case 'limited':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'info';
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

  const variant = getStatusVariant();
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    inline: 'relative',
  };

  if (position === 'inline') {
    return (
      <StatusCard 
        variant={variant} 
        size="sm" 
        padding="sm"
        className={cn('transition-all duration-300 ease-in-out', className)}
      >
        <div className="flex items-center space-x-2">
          <OfflineIcon variant={variant} size="sm" />
          <StatusCaption colorVariant={variant}>{message}</StatusCaption>
          
          {showDetails && hasOfflineData && effectiveStatus === 'offline' && (
            <StatusCaption colorVariant="neutral" className="text-xs">
              ✓ Offline data available
            </StatusCaption>
          )}
        </div>
      </StatusCard>
    );
  }

  return (
    <div
      className={cn(
        positionClasses[position],
        'transition-all duration-300 ease-in-out',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <StatusCard 
        variant={variant} 
        size="sm" 
        padding="sm"
        className="mx-4 my-2"
      >
        <div className="flex items-center justify-center space-x-2">
          <OfflineIcon variant={variant} size="sm" />
          <StatusCaption colorVariant={variant}>{message}</StatusCaption>
          
          {showDetails && (
            <div className="hidden sm:flex items-center space-x-4 ml-4">
              {connectionType && (
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Connection: {connectionType.toUpperCase()}
                </StatusCaption>
              )}
              
              {effectiveStatus === 'offline' && lastOnlineTime && (
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Last online: {formatLastOnlineTime(lastOnlineTime)}
                </StatusCaption>
              )}
              
              {effectiveStatus === 'offline' && hasOfflineData && (
                <StatusCaption colorVariant="neutral" className="text-xs">
                  ✓ Offline data available
                </StatusCaption>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile details */}
        {showDetails && (
          <div className="sm:hidden mt-1 text-center">
            {effectiveStatus === 'offline' && hasOfflineData && (
              <StatusCaption colorVariant="neutral" className="text-xs">
                Offline content available
              </StatusCaption>
            )}
          </div>
        )}
      </StatusCard>
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

  const getStatusVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    switch (effectiveStatus) {
      case 'online':
        return 'success';
      case 'limited':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'info';
    }
  };

  const variant = getStatusVariant();

  return (
    <StatusCard 
      variant={variant} 
      size="xs" 
      padding="xs"
      className={cn('inline-flex items-center space-x-1 rounded-full', className)}
      title={message}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {showText && (
        <StatusCaption colorVariant={variant} className="text-xs">
          {effectiveStatus}
        </StatusCaption>
      )}
    </StatusCard>
  );
});

StatusBadge.displayName = 'StatusBadge';