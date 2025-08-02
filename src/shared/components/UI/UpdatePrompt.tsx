/**
 * @file UpdatePrompt.tsx
 * @description Component for prompting users about app updates
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { useOfflineStore } from '../../stores/offline-store';
import { errorReporting } from '../../services/errorReporting';
import { 
  StatusCard,
  LoadingIcon,
  StatusHeading,
  StatusDescription,
  StatusCaption,
  StatusActions
} from './index';

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
      // Use centralized error reporting instead of console.error
      errorReporting.reportServiceWorkerError(
        'Failed to update app',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'UpdatePrompt',
          operation: 'update_app',
        }
      );
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

  if (position === 'center') {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <div className={cn(positionClasses[position], className)}>
          <StatusCard
            variant="info"
            size="md"
            padding="md"
            className={cn(
              'transform transition-all duration-300 ease-in-out scale-100',
              containerClasses[position]
            )}
            role="dialog"
            aria-labelledby="update-title"
            aria-describedby="update-description"
          >
            {renderUpdateContent()}
          </StatusCard>
        </div>
      </>
    );
  }

  return (
    <div className={cn(positionClasses[position], className)}>
      <StatusCard
        variant="info"
        size="md"
        padding="md"
        className={cn(
          'transform transition-all duration-300 ease-in-out translate-y-0 shadow-lg',
          containerClasses[position]
        )}
        role="dialog"
        aria-labelledby="update-title"
        aria-describedby="update-description"
      >
        {renderUpdateContent()}
      </StatusCard>
    </div>
  );

  function renderUpdateContent() {
    return (
      <>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <LoadingIcon variant="info" size="md" />
            <StatusHeading
              id="update-title"
              colorVariant="info"
              className="text-lg"
            >
              Update Available
            </StatusHeading>
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
          <StatusDescription
            id="update-description"
            colorVariant="neutral"
            className="mb-3"
          >
            A new version of HSA Songbook is available with improvements and bug fixes.
          </StatusDescription>
          
          <div className="space-y-1">
            <StatusCaption colorVariant="neutral" className="text-xs">
              • Enhanced offline functionality
            </StatusCaption>
            <StatusCaption colorVariant="neutral" className="text-xs">
              • Improved sync performance
            </StatusCaption>
            <StatusCaption colorVariant="neutral" className="text-xs">
              • Bug fixes and stability improvements
            </StatusCaption>
          </div>
        </div>

        {/* Actions */}
        <StatusActions>
          <StatusActions.Custom
            onClick={handleUpdate}
            disabled={isUpdating}
            variant="primary"
            className="flex-1"
          >
            {isUpdating ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingIcon variant="info" size="xs" animate />
                <span>Updating...</span>
              </div>
            ) : (
              'Update Now'
            )}
          </StatusActions.Custom>
          
          <StatusActions.Custom
            onClick={handleDismiss}
            variant="outline"
          >
            Later
          </StatusActions.Custom>
        </StatusActions>

        {/* Update progress */}
        {isUpdating && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <StatusCaption colorVariant="neutral" className="text-xs">
                Installing update...
              </StatusCaption>
            </div>
          </div>
        )}
      </>
    );
  }
});

UpdatePrompt.displayName = 'UpdatePrompt';