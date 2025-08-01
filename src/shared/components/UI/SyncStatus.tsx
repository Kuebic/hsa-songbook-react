/**
 * @file SyncStatus.tsx
 * @description Component for displaying sync queue status and progress
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { useSyncQueueStore } from '../../stores/sync-queue-store';

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

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center space-x-2 px-2 py-1 rounded-lg text-xs',
          isSyncing
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            : stats.failed > 0
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : stats.pending > 0
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          className
        )}
        title={`Sync: ${stats.pending} pending, ${stats.failed} failed`}
      >
        {isSyncing && (
          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        
        <span>
          {isSyncing
            ? 'Syncing...'
            : stats.failed > 0
            ? `${stats.failed} failed`
            : stats.pending > 0
            ? `${stats.pending} pending`
            : 'Synced'
          }
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Sync Status
          </h3>
          
          {isSyncing && (
            <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
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
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Completed
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Pending
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {stats.failed}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Failed
          </div>
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
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        {isSyncing
          ? 'Synchronizing changes with server...'
          : stats.failed > 0
          ? `${stats.failed} operations failed. Check your connection.`
          : stats.pending > 0
          ? `${stats.pending} operations waiting to sync.`
          : 'All changes synchronized.'
        }
      </div>

      {/* Last sync time */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Last sync: {formatLastSyncTime(lastSyncTime)}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {stats.completed > 0 && (
          <button
            onClick={clearCompleted}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear Completed
          </button>
        )}
        
        {stats.failed > 0 && (
          <button
            onClick={clearAll}
            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && showDetails && failedOps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed Operations
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {failedOps.map((op) => (
              <div
                key={op.id}
                className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
              >
                <div className="font-medium text-red-800 dark:text-red-200">
                  {op.type} {op.resource}
                </div>
                {op.lastError && (
                  <div className="text-red-600 dark:text-red-400 mt-1">
                    {op.lastError}
                  </div>
                )}
                <div className="text-red-500 dark:text-red-500 mt-1">
                  Retried {op.retryCount}/{op.maxRetries} times
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

SyncStatus.displayName = 'SyncStatus';