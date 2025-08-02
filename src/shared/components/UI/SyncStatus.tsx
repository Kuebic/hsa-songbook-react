/**
 * @file SyncStatus.tsx
 * @description Component for displaying sync queue status and progress
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { useSyncQueueStore } from '../../stores/sync-queue-store';
import { 
  StatusCard,
  SyncIcon,
  StatusHeading,
  StatusCaption,
  StatusActions
} from './index';

export interface SyncStatusProps {
  /** CSS class name */
  className?: string;
  /** Show detailed sync information */
  showDetails?: boolean;
  /** Show as compact indicator */
  compact?: boolean;
}

/**
 * Sync queue status component
 */
export const SyncStatus = React.memo<SyncStatusProps>(({
  className,
  showDetails = false,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isSyncing,
    getSyncStats,
    getFailedOperations,
    lastSyncTime,
    clearCompleted,
    clearAll,
  } = useSyncQueueStore();

  const stats = getSyncStats();
  const failedOps = getFailedOperations();

  // Don't show if no sync activity
  if (!isSyncing && stats.total === 0) {
    return null;
  }

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSyncVariant = (): 'info' | 'error' | 'warning' | 'success' => {
    if (isSyncing) return 'info';
    if (stats.failed > 0) return 'error';
    if (stats.pending > 0) return 'warning';
    return 'success';
  };

  if (compact) {
    const variant = getSyncVariant();
    
    return (
      <StatusCard 
        variant={variant} 
        size="xs" 
        padding="xs"
        className={cn('inline-flex items-center space-x-2 rounded-lg', className)}
        title={`Sync: ${stats.pending} pending, ${stats.failed} failed`}
      >
        <SyncIcon 
          variant={variant} 
          size="xs" 
          animate={isSyncing}
        />
        
        <StatusCaption colorVariant={variant} className="text-xs">
          {isSyncing
            ? 'Syncing...'
            : stats.failed > 0
            ? `${stats.failed} failed`
            : stats.pending > 0
            ? `${stats.pending} pending`
            : 'Synced'
          }
        </StatusCaption>
      </StatusCard>
    );
  }

  const variant = getSyncVariant();

  return (
    <StatusCard 
      variant={variant} 
      size="md" 
      padding="md"
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SyncIcon 
            variant={variant} 
            size="sm" 
            animate={isSyncing}
          />
          <StatusHeading colorVariant={variant} className="text-sm">
            Sync Status
          </StatusHeading>
        </div>
        
        {showDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <StatusHeading colorVariant="success" className="text-lg">
            {stats.completed}
          </StatusHeading>
          <StatusCaption colorVariant="neutral" className="text-xs">
            Completed
          </StatusCaption>
        </div>
        
        <div className="text-center">
          <StatusHeading colorVariant="warning" className="text-lg">
            {stats.pending}
          </StatusHeading>
          <StatusCaption colorVariant="neutral" className="text-xs">
            Pending
          </StatusCaption>
        </div>
        
        <div className="text-center">
          <StatusHeading colorVariant="error" className="text-lg">
            {stats.failed}
          </StatusHeading>
          <StatusCaption colorVariant="neutral" className="text-xs">
            Failed
          </StatusCaption>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round((stats.completed / stats.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Status message */}
      <StatusCaption colorVariant="neutral" className="text-xs mb-3">
        {isSyncing
          ? 'Synchronizing changes with server...'
          : stats.failed > 0
          ? `${stats.failed} operations failed. Check your connection.`
          : stats.pending > 0
          ? `${stats.pending} operations waiting to sync.`
          : 'All changes synchronized.'
        }
      </StatusCaption>

      {/* Last sync time */}
      <StatusCaption colorVariant="neutral" className="text-xs mb-3">
        Last sync: {formatLastSyncTime(lastSyncTime)}
      </StatusCaption>

      {/* Actions */}
      <StatusActions>
        {stats.completed > 0 && (
          <StatusActions.Custom
            onClick={clearCompleted}
            variant="outline"
            size="xs"
          >
            Clear Completed
          </StatusActions.Custom>
        )}
        
        {stats.failed > 0 && (
          <StatusActions.Custom
            onClick={clearAll}
            variant="outline"
            size="xs"
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Clear All
          </StatusActions.Custom>
        )}
      </StatusActions>

      {/* Expanded details */}
      {isExpanded && showDetails && failedOps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <StatusHeading colorVariant="neutral" className="text-xs mb-2">
            Failed Operations
          </StatusHeading>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {failedOps.map((op) => (
              <StatusCard
                key={op.id}
                variant="error"
                size="xs"
                padding="xs"
                className="text-xs"
              >
                <StatusCaption colorVariant="error" className="font-medium">
                  {op.type} {op.resource}
                </StatusCaption>
                {op.lastError && (
                  <StatusCaption colorVariant="error" className="mt-1">
                    {op.lastError}
                  </StatusCaption>
                )}
                <StatusCaption colorVariant="error" className="mt-1">
                  Retried {op.retryCount}/{op.maxRetries} times
                </StatusCaption>
              </StatusCard>
            ))}
          </div>
        </div>
      )}
    </StatusCard>
  );
});

SyncStatus.displayName = 'SyncStatus';