/**
 * @file StatusActions.tsx
 * @description Standardized action button layouts for error and status components
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { ErrorUISpacing } from '../../design/errorUITokens';
import { useFocusManagement } from '../../hooks/useFocusManagement';

export interface StatusAction {
  /** Action label */
  label: string;
  /** Click handler */
  onClick: () => void | Promise<void>;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether the action is loading */
  loading?: boolean;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether to show the action on mobile */
  hideOnMobile?: boolean;
  /** Whether this is the primary action (for focus management) */
  isPrimary?: boolean;
  /** Custom aria-label for accessibility */
  'aria-label'?: string;
}

export interface StatusActionsProps {
  /** Array of action configurations */
  actions: StatusAction[];
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Content alignment */
  alignment?: 'left' | 'center' | 'right';
  /** Whether to stack actions on mobile */
  stackOnMobile?: boolean;
  /** Custom gap size */
  gap?: keyof typeof ErrorUISpacing.gap;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of actions to show before grouping */
  maxVisibleActions?: number;
  /** Whether to auto-focus the primary action */
  autoFocus?: boolean;
  /** Whether to trap focus within the actions */
  trapFocus?: boolean;
  /** ARIA role for the actions container */
  role?: string;
  /** ARIA label for the actions container */
  'aria-label'?: string;
}

/**
 * Get button variant priority order for consistent action hierarchy
 */
function getActionPriority(variant?: StatusAction['variant']): number {
  switch (variant) {
    case 'primary':
      return 1;
    case 'success':
      return 2;
    case 'danger':
      return 3;
    case 'secondary':
      return 4;
    case 'outline':
      return 5;
    default:
      return 4;
  }
}

/**
 * Sort actions by priority (primary actions first)
 */
function sortActionsByPriority(actions: StatusAction[]): StatusAction[] {
  return [...actions].sort((a, b) => {
    const priorityA = getActionPriority(a.variant);
    const priorityB = getActionPriority(b.variant);
    return priorityA - priorityB;
  });
}

/**
 * Unified action button container
 */
export const StatusActions = React.forwardRef<HTMLDivElement, StatusActionsProps>(({
  actions,
  orientation = 'horizontal',
  alignment = 'center',
  stackOnMobile = true,
  gap = 'sm',
  className,
  maxVisibleActions,
  autoFocus = false,
  trapFocus = false,
  role = 'group',
  'aria-label': ariaLabel = 'Action buttons',
  ...props
}, ref) => {
  const [showAllActions, setShowAllActions] = React.useState(false);
  
  // Focus management
  const { containerRef, primaryActionRef, handleKeyDown } = useFocusManagement({
    autoFocusPrimary: autoFocus,
    trapFocus,
    returnFocus: false
  });
  
  // Sort actions by priority
  const sortedActions = sortActionsByPriority(actions);
  
  // Find primary action for focus management
  const primaryAction = sortedActions.find(action => action.isPrimary || action.variant === 'primary');
  
  // Determine which actions to show
  const visibleActions = maxVisibleActions && !showAllActions
    ? sortedActions.slice(0, maxVisibleActions)
    : sortedActions;
    
  const hiddenActions = maxVisibleActions && !showAllActions
    ? sortedActions.slice(maxVisibleActions)
    : [];

  const gapSize = ErrorUISpacing.gap[gap];

  const containerClasses = cn(
    // Base layout
    'flex flex-wrap',
    
    // Orientation
    orientation === 'vertical' ? 'flex-col' : 'flex-row',
    
    // Alignment
    alignment === 'left' && 'justify-start',
    alignment === 'center' && 'justify-center',
    alignment === 'right' && 'justify-end',
    
    // Mobile stacking
    stackOnMobile && orientation === 'horizontal' && 'flex-col sm:flex-row',
    
    // Additional classes
    className
  );

  return (
    <div
      ref={(node) => {
        // Set both refs
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        containerRef.current = node;
      }}
      className={containerClasses}
      style={{ gap: gapSize }}
      role={role}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {visibleActions.map((action, index) => {
        const IconComponent = action.icon;
        const isPrimaryButton = action === primaryAction;
        
        return (
          <Button
            key={`${action.label}-${index}`}
            ref={isPrimaryButton ? primaryActionRef : undefined}
            variant={action.variant || 'primary'}
            size={action.size || 'sm'}
            loading={action.loading}
            disabled={action.disabled}
            onClick={action.onClick}
            aria-label={action['aria-label']}
            className={cn(
              // Mobile visibility
              action.hideOnMobile && 'hidden sm:inline-flex',
              
              // Full width on mobile when stacking
              stackOnMobile && orientation === 'horizontal' && 'w-full sm:w-auto'
            )}
          >
            {IconComponent && (
              <IconComponent className="w-4 h-4 mr-2" />
            )}
            {action.label}
          </Button>
        );
      })}
      
      {/* Show more actions button */}
      {hiddenActions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllActions(!showAllActions)}
          className={cn(
            stackOnMobile && orientation === 'horizontal' && 'w-full sm:w-auto'
          )}
        >
          {showAllActions ? 'Show Less' : `+${hiddenActions.length} More`}
        </Button>
      )}
    </div>
  );
});

StatusActions.displayName = 'StatusActions';

/**
 * Predefined action sets for common error scenarios
 */

/**
 * Basic retry action set
 */
export interface StatusRetryActionsProps extends Omit<StatusActionsProps, 'actions'> {
  onRetry: () => void | Promise<void>;
  onCancel?: () => void;
  retryLabel?: string;
  cancelLabel?: string;
  retryLoading?: boolean;
}

export const StatusRetryActions = React.forwardRef<HTMLDivElement, StatusRetryActionsProps>(({
  onRetry,
  onCancel,
  retryLabel = 'Try Again',
  cancelLabel = 'Cancel',
  retryLoading = false,
  ...props
}, ref) => {
  const actions: StatusAction[] = [
    {
      label: retryLabel,
      onClick: onRetry,
      variant: 'primary',
      loading: retryLoading,
      isPrimary: true,
      'aria-label': `${retryLabel}. This will attempt the operation again.`
    },
  ];

  if (onCancel) {
    actions.push({
      label: cancelLabel,
      onClick: onCancel,
      variant: 'outline',
      'aria-label': `${cancelLabel}. This will dismiss the error without retrying.`
    });
  }

  return (
    <StatusActions
      ref={ref}
      actions={actions}
      autoFocus={true}
      aria-label="Error recovery actions"
      {...props}
    />
  );
});

StatusRetryActions.displayName = 'StatusRetryActions';

/**
 * Navigation action set for route errors
 */
export interface StatusNavigationActionsProps extends Omit<StatusActionsProps, 'actions'> {
  onGoHome?: () => void;
  onGoBack?: () => void;
  onRefresh?: () => void;
  onRetry?: () => void;
  homeLabel?: string;
  backLabel?: string;
  refreshLabel?: string;
  retryLabel?: string;
}

export const StatusNavigationActions = React.forwardRef<HTMLDivElement, StatusNavigationActionsProps>(({
  onGoHome,
  onGoBack,
  onRefresh,
  onRetry,
  homeLabel = 'Go Home',
  backLabel = 'Go Back',
  refreshLabel = 'Refresh Page',
  retryLabel = 'Try Again',
  ...props
}, ref) => {
  const actions: StatusAction[] = [];

  if (onRetry) {
    actions.push({
      label: retryLabel,
      onClick: onRetry,
      variant: 'primary',
    });
  }

  if (onGoBack) {
    actions.push({
      label: backLabel,
      onClick: onGoBack,
      variant: 'secondary',
    });
  }

  if (onGoHome) {
    actions.push({
      label: homeLabel,
      onClick: onGoHome,
      variant: 'secondary',
    });
  }

  if (onRefresh) {
    actions.push({
      label: refreshLabel,
      onClick: onRefresh,
      variant: 'outline',
    });
  }

  return (
    <StatusActions
      ref={ref}
      actions={actions}
      maxVisibleActions={3}
      {...props}
    />
  );
});

StatusNavigationActions.displayName = 'StatusNavigationActions';

/**
 * Storage-related action set
 */
export interface StatusStorageActionsProps extends Omit<StatusActionsProps, 'actions'> {
  onRetry?: () => void;
  onCheckStorage?: () => void;
  onClearCache?: () => void;
  onWorkOffline?: () => void;
  retryLabel?: string;
  checkStorageLabel?: string;
  clearCacheLabel?: string;
  workOfflineLabel?: string;
}

export const StatusStorageActions = React.forwardRef<HTMLDivElement, StatusStorageActionsProps>(({
  onRetry,
  onCheckStorage,
  onClearCache,
  onWorkOffline,
  retryLabel = 'Try Again',
  checkStorageLabel = 'Check Storage',
  clearCacheLabel = 'Clear Cache',
  workOfflineLabel = 'Work Offline',
  ...props
}, ref) => {
  const actions: StatusAction[] = [];

  if (onRetry) {
    actions.push({
      label: retryLabel,
      onClick: onRetry,
      variant: 'primary',
    });
  }

  if (onCheckStorage) {
    actions.push({
      label: checkStorageLabel,
      onClick: onCheckStorage,
      variant: 'secondary',
    });
  }

  if (onClearCache) {
    actions.push({
      label: clearCacheLabel,
      onClick: onClearCache,
      variant: 'secondary',
    });
  }

  if (onWorkOffline) {
    actions.push({
      label: workOfflineLabel,
      onClick: onWorkOffline,
      variant: 'outline',
    });
  }

  return (
    <StatusActions
      ref={ref}
      actions={actions}
      maxVisibleActions={2}
      {...props}
    />
  );
});

StatusStorageActions.displayName = 'StatusStorageActions';

/**
 * Service worker related action set
 */
export interface StatusServiceWorkerActionsProps extends Omit<StatusActionsProps, 'actions'> {
  onRetry?: () => void;
  onRestartServiceWorker?: () => void;
  onClearCache?: () => void;
  onContinueWithoutSW?: () => void;
  retryLabel?: string;
  restartLabel?: string;
  clearCacheLabel?: string;
  continueLabel?: string;
}

export const StatusServiceWorkerActions = React.forwardRef<HTMLDivElement, StatusServiceWorkerActionsProps>(({
  onRetry,
  onRestartServiceWorker,
  onClearCache,
  onContinueWithoutSW,
  retryLabel = 'Try Again',
  restartLabel = 'Restart Service Worker',
  clearCacheLabel = 'Clear Cache',
  continueLabel = 'Continue Without SW',
  ...props
}, ref) => {
  const actions: StatusAction[] = [];

  if (onRetry) {
    actions.push({
      label: retryLabel,
      onClick: onRetry,
      variant: 'primary',
    });
  }

  if (onRestartServiceWorker) {
    actions.push({
      label: restartLabel,
      onClick: onRestartServiceWorker,
      variant: 'secondary',
    });
  }

  if (onClearCache) {
    actions.push({
      label: clearCacheLabel,
      onClick: onClearCache,
      variant: 'secondary',
    });
  }

  if (onContinueWithoutSW) {
    actions.push({
      label: continueLabel,
      onClick: onContinueWithoutSW,
      variant: 'outline',
    });
  }

  return (
    <StatusActions
      ref={ref}
      actions={actions}
      maxVisibleActions={2}
      {...props}
    />
  );
});

StatusServiceWorkerActions.displayName = 'StatusServiceWorkerActions';