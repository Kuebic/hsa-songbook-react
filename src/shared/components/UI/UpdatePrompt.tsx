/**
 * @file UpdatePrompt.tsx
 * @description Component for prompting users about app updates
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { useOfflineStore } from '../../stores/offline-store';

export interface UpdatePromptProps {
  /** CSS class name */
  className?: string;
  /** Auto-dismiss after specified milliseconds */
  autoDismiss?: number;
  /** Position of the prompt */
  position?: 'top' | 'bottom' | 'center';
}

/**
 * App update prompt component
 */
export const UpdatePrompt = React.memo<UpdatePromptProps>(({
  className,
  autoDismiss,
  position = 'bottom'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { status, updateServiceWorker } = useServiceWorker();
  const { isUpdateAvailable, isUpdating } = useOfflineStore();

  // Show prompt when update is available
  useEffect(() => {
    if (isUpdateAvailable && !status.isUpdating && !isDismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isUpdateAvailable, status.isUpdating, isDismissed]);

  // Auto-dismiss functionality
  useEffect(() => {
    if (isVisible && autoDismiss) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismiss]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker();
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isVisible) {
    return null;
  }

  const positionClasses = {
    top: 'fixed top-4 left-4 right-4 z-50',
    bottom: 'fixed bottom-4 left-4 right-4 z-50',
    center: 'fixed inset-0 flex items-center justify-center z-50 p-4',
  };

  const containerClasses = {
    top: 'max-w-md mx-auto',
    bottom: 'max-w-md mx-auto',
    center: 'max-w-sm w-full',
  };

  return (
    <>
      {position === 'center' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}
      
      <div className={cn(positionClasses[position], className)}>
        <div
          className={cn(
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-lg p-4',
            'transform transition-all duration-300 ease-in-out',
            position === 'center' ? 'scale-100' : 'translate-y-0',
            containerClasses[position]
          )}
          role="dialog"
          aria-labelledby="update-title"
          aria-describedby="update-description"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3
                id="update-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Update Available
              </h3>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss update prompt"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p
              id="update-description"
              className="text-sm text-gray-600 dark:text-gray-400 mb-3"
            >
              A new version of HSA Songbook is available with improvements and bug fixes.
            </p>
            
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
              <p>• Enhanced offline functionality</p>
              <p>• Improved sync performance</p>
              <p>• Bug fixes and stability improvements</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-md',
                'bg-blue-600 text-white hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
            >
              {isUpdating ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Now'
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className={cn(
                'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300',
                'border border-gray-300 dark:border-gray-600 rounded-md',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                'transition-colors duration-150'
              )}
            >
              Later
            </button>
          </div>

          {/* Update progress */}
          {isUpdating && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <span>Installing update...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

UpdatePrompt.displayName = 'UpdatePrompt';