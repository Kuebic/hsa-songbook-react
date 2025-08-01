/**
 * @file StorageQuotaWarning.tsx
 * @description Component for displaying storage quota warnings and management options
 */

import React, { useState } from 'react';
import { useStorageStats, useDataPortability } from '../../hooks/useOfflineStorage';
import { CleanupConfig } from '../../types/storage.types';
import { Button } from './Button';
import { Card } from './Card';

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
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

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

  const getWarningLevel = () => {
    if (isQuotaCritical) return 'critical';
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

  const getWarningColors = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700',
          icon: '🚨',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700',
          icon: '⚠️',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: '💾',
        };
    }
  };

  const colors = getWarningColors();

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);

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
        setCleanupResult(
          `Cleanup completed! Removed ${deletedSongs} songs and ${deletedSetlists} setlists.`
        );
      } else {
        setCleanupResult(`Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      setCleanupResult(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleExportData = async () => {
    const success = await downloadExport();
    if (success) {
      alert('Data export completed! Your data has been downloaded.');
    }
  };

  return (
    <Card className={`${colors.bg} ${colors.border} ${colors.text} ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{colors.icon}</span>
            <h3 className="font-semibold">Storage Management</h3>
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
        <p className="mt-2 text-sm">{getWarningMessage()}</p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Used: {formatBytes(quota.used)}</span>
            <span>Total: {formatBytes(quota.total)}</span>
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
          <div className="text-xs text-center mt-1">
            {quota.percentage}% used
          </div>
        </div>

        {/* Expanded details */}
        {(isExpanded || showDetails) && (
          <div className="mt-4 space-y-4">
            {/* Storage breakdown */}
            <div>
              <h4 className="font-medium text-sm mb-2">Storage Breakdown</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Songs ({stats.totalSongs} items):</span>
                  <span>{formatBytes(stats.songsSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Setlists ({stats.totalSetlists} items):</span>
                  <span>{formatBytes(stats.setlistsSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Preferences:</span>
                  <span>{formatBytes(stats.preferencesSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync queue:</span>
                  <span>{formatBytes(stats.syncQueueSize)}</span>
                </div>
              </div>
            </div>

            {/* Cleanup result */}
            {cleanupResult && (
              <div className={`p-2 rounded text-xs ${
                cleanupResult.includes('failed') || cleanupResult.includes('error')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {cleanupResult}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className={`text-white text-xs px-3 py-1 ${colors.button} disabled:opacity-50`}
              >
                {isCleaningUp ? 'Cleaning...' : 'Clean Up Old Data'}
              </Button>
              
              <Button
                onClick={handleExportData}
                className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1"
              >
                Export Data
              </Button>

              {/* Manual storage management link */}
              <button
                onClick={() => {
                  if ('storage' in navigator && 'persist' in navigator.storage) {
                    navigator.storage.persist().then(granted => {
                      alert(granted 
                        ? 'Storage persistence granted! Your data will be protected from automatic cleanup.' 
                        : 'Storage persistence not granted. Data may be cleared when storage is low.'
                      );
                    });
                  } else {
                    alert('Storage persistence not supported in this browser.');
                  }
                }}
                className="text-xs underline hover:no-underline"
              >
                Request Storage Persistence
              </button>
            </div>

            {/* Tips */}
            <div className="text-xs">
              <h4 className="font-medium mb-1">Tips to free up space:</h4>
              <ul className="list-disc list-inside space-y-1 opacity-80">
                <li>Remove unused songs and setlists</li>
                <li>Export important data before cleanup</li>
                <li>Unfavorite old songs to allow cleanup</li>
                <li>Clear browser cache if storage is critical</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Hook to automatically show storage warnings
 */
export function useStorageQuotaWarning(userId: string) {
  const { isQuotaWarning, isQuotaCritical } = useStorageStats();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = (isQuotaWarning || isQuotaCritical) && !dismissed;
  
  const dismiss = () => setDismissed(true);
  
  const reset = () => setDismissed(false);

  return {
    shouldShow,
    isWarning: isQuotaWarning,
    isCritical: isQuotaCritical,
    dismiss,
    reset,
    component: shouldShow ? (
      <StorageQuotaWarning 
        userId={userId} 
        autoHide={false} 
        onClose={dismiss}
      />
    ) : null,
  };
}