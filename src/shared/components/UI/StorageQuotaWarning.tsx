/**
 * @file StorageQuotaWarning.tsx
 * @description Component for displaying storage quota warnings and management options
 */

import { useState } from 'react';
import { useStorageStats, useDataPortability } from '../../hooks/useOfflineStorage';
import type { CleanupConfig } from '../../types/storage.types';
import { 
  StatusCard,
  StorageIcon,
  StatusHeading,
  StatusDescription,
  StatusCaption,
  StatusActions,
  useToastHelpers
} from './index';

interface StorageQuotaWarningProps {
  userId: string;
  className?: string;
  showDetails?: boolean;
  autoHide?: boolean;
  onClose?: () => void;
}

export function StorageQuotaWarning({ 
  userId, 
  className = '', 
  showDetails = false,
  autoHide = false,
  onClose 
}: StorageQuotaWarningProps) {
  const { stats, quota, loading, isQuotaWarning, isQuotaCritical, performCleanup } = useStorageStats();
  const { downloadExport } = useDataPortability(userId);
  const { showSuccess, showError } = useToastHelpers();
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Don't show if quota is fine and autoHide is enabled
  if (autoHide && !isQuotaWarning && !isQuotaCritical) {
    return null;
  }

  if (loading || !quota || !stats) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageVariant = (): 'error' | 'warning' | 'info' => {
    if (isQuotaCritical) return 'error';
    if (isQuotaWarning) return 'warning';
    return 'info';
  };

  const getWarningMessage = () => {
    if (isQuotaCritical) {
      return 'Storage quota critically low! Please free up space immediately.';
    }
    if (isQuotaWarning) {
      return 'Storage quota warning: You\'re using over 80% of available space.';
    }
    return `Storage usage: ${quota.percentage}% of available space.`;
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);

    try {
      const cleanupConfig: CleanupConfig = {
        maxAge: 365, // Keep data for 1 year
        maxUnusedAge: 90, // Remove unused items after 90 days
        maxCacheSize: 50, // Target 50MB cache size
        quotaWarningThreshold: 80,
        quotaCriticalThreshold: 95,
        autoCleanup: false,
        cleanupOnStart: false,
        cleanupInterval: 24 * 60 * 60 * 1000,
      };

      const result = await performCleanup(cleanupConfig);
      
      if (result.success) {
        const { deletedSongs, deletedSetlists } = result.data!;
        showSuccess(
          'Cleanup Completed',
          `Removed ${deletedSongs} songs and ${deletedSetlists} setlists.`
        );
      } else {
        showError('Cleanup Failed', result.error);
      }
    } catch (error) {
      showError('Cleanup Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleExportData = async () => {
    const success = await downloadExport();
    if (success) {
      showSuccess('Export Completed', 'Your data has been downloaded.');
    } else {
      showError('Export Failed', 'Unable to download your data.');
    }
  };

  const handleRequestPersistence = async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        if (granted) {
          showSuccess(
            'Storage Persistence Granted',
            'Your data will be protected from automatic cleanup.'
          );
        } else {
          showError(
            'Storage Persistence Denied',
            'Data may be cleared when storage is low.'
          );
        }
      } catch (error) {
        showError('Storage Persistence Error', 'Unable to request storage persistence.');
      }
    } else {
      showError('Not Supported', 'Storage persistence not supported in this browser.');
    }
  };

  const variant = getStorageVariant();

  return (
    <StatusCard 
      variant={variant} 
      size="lg" 
      padding="md"
      className={className}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StorageIcon variant={variant} size="md" />
          <StatusHeading colorVariant={variant}>
            Storage Management
          </StatusHeading>
        </div>
        <div className="flex items-center space-x-2">
          {!showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm underline hover:no-underline"
            >
              {isExpanded ? 'Less info' : 'More info'}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-lg hover:opacity-70"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main message */}
      <StatusDescription colorVariant="neutral" className="mb-3">
        {getWarningMessage()}
      </StatusDescription>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <StatusCaption colorVariant="neutral" className="text-xs">
            Used: {formatBytes(quota.used)}
          </StatusCaption>
          <StatusCaption colorVariant="neutral" className="text-xs">
            Total: {formatBytes(quota.total)}
          </StatusCaption>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isQuotaCritical 
                ? 'bg-red-500' 
                : isQuotaWarning 
                  ? 'bg-orange-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(quota.percentage, 100)}%` }}
          />
        </div>
        <StatusCaption colorVariant="neutral" className="text-xs text-center mt-1">
          {quota.percentage}% used
        </StatusCaption>
      </div>

      {/* Expanded details */}
      {(isExpanded || showDetails) && (
        <div className="space-y-4">
          {/* Storage breakdown */}
          <div>
            <StatusHeading colorVariant="neutral" className="text-sm mb-2">
              Storage Breakdown
            </StatusHeading>
            <div className="space-y-1">
              <div className="flex justify-between">
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Songs ({stats.totalSongs} items):
                </StatusCaption>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  {formatBytes(stats.songsSize)}
                </StatusCaption>
              </div>
              <div className="flex justify-between">
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Setlists ({stats.totalSetlists} items):
                </StatusCaption>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  {formatBytes(stats.setlistsSize)}
                </StatusCaption>
              </div>
              <div className="flex justify-between">
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Preferences:
                </StatusCaption>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  {formatBytes(stats.preferencesSize)}
                </StatusCaption>
              </div>
              <div className="flex justify-between">
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Sync queue:
                </StatusCaption>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  {formatBytes(stats.syncQueueSize)}
                </StatusCaption>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <StatusActions>
            <StatusActions.Custom
              onClick={handleCleanup}
              disabled={isCleaningUp}
              variant="primary"
              size="sm"
            >
              {isCleaningUp ? 'Cleaning...' : 'Clean Up Old Data'}
            </StatusActions.Custom>
            
            <StatusActions.Custom
              onClick={handleExportData}
              variant="secondary"
              size="sm"
            >
              Export Data
            </StatusActions.Custom>

            <StatusActions.Custom
              onClick={handleRequestPersistence}
              variant="outline"
              size="sm"
            >
              Request Storage Persistence
            </StatusActions.Custom>
          </StatusActions>

          {/* Tips */}
          <div>
            <StatusHeading colorVariant="neutral" className="text-xs mb-1">
              Tips to free up space:
            </StatusHeading>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Remove unused songs and setlists
                </StatusCaption>
              </li>
              <li>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Export important data before cleanup
                </StatusCaption>
              </li>
              <li>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Unfavorite old songs to allow cleanup
                </StatusCaption>
              </li>
              <li>
                <StatusCaption colorVariant="neutral" className="text-xs">
                  Clear browser cache if storage is critical
                </StatusCaption>
              </li>
            </ul>
          </div>
        </div>
      )}
    </StatusCard>
  );
}

// Hook moved to separate file to fix Fast Refresh issues
// Import from: import { useStorageQuotaWarning } from '../../hooks/useStorageQuotaWarning';