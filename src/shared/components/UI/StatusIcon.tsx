/**
 * @file StatusIcon.tsx
 * @description Consistent SVG icon system for error and status components
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { ErrorUIIcons, ErrorUIColors, type ErrorUIVariantKey } from '../../design/errorUITokens';

export type StatusIconType = 
  | 'error' 
  | 'warning' 
  | 'success' 
  | 'info'
  | 'storage'
  | 'network'
  | 'sync'
  | 'component'
  | 'route'
  | 'async'
  | 'loading'
  | 'offline'
  | 'retry';

export interface StatusIconProps {
  /** Icon type/variant */
  type: StatusIconType;
  /** Icon size */
  size?: keyof typeof ErrorUIIcons.size;
  /** Custom color override */
  color?: string;
  /** Color variant for semantic coloring */
  variant?: 'error' | 'warning' | 'success' | 'info';
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the icon */
  animate?: boolean;
  /** Custom animation type */
  animation?: 'spin' | 'pulse' | 'bounce' | 'shake';
  /** Screen reader label for accessibility */
  'aria-label'?: string;
  /** Whether icon is decorative (hidden from screen readers) */
  decorative?: boolean;
  /** Title for tooltip/accessibility */
  title?: string;
}

/**
 * SVG icon paths for different status types
 */
const iconPaths: Record<StatusIconType, JSX.Element> = {
  error: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
    />
  ),
  
  warning: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
    />
  ),
  
  success: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  ),
  
  info: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  ),
  
  storage: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" 
    />
  ),
  
  network: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
    />
  ),
  
  sync: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  ),
  
  component: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
    />
  ),
  
  route: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
    />
  ),
  
  async: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M13 10V3L4 14h7v7l9-11h-7z" 
    />
  ),
  
  loading: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  ),
  
  offline: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364M5.636 5.636l12.728 12.728M12 8a4 4 0 000 8 4 4 0 000-8z" 
    />
  ),
  
  retry: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  ),
};

/**
 * Get icon color based on variant
 */
function getIconColor(variant?: 'error' | 'warning' | 'success' | 'info', customColor?: string): string {
  if (customColor) return customColor;
  
  switch (variant) {
    case 'error':
      return ErrorUIColors.error[600];
    case 'warning':
      return ErrorUIColors.warning[600];
    case 'success':
      return ErrorUIColors.success[600];
    case 'info':
      return ErrorUIColors.info[600];
    default:
      return ErrorUIColors.neutral[600];
  }
}

/**
 * Get animation classes
 */
function getAnimationClasses(animate?: boolean, animation?: string): string {
  if (!animate) return '';
  
  switch (animation) {
    case 'spin':
      return 'animate-spin';
    case 'pulse':
      return 'animate-pulse';
    case 'bounce':
      return 'animate-bounce';
    case 'shake':
      return 'animate-shake';
    default:
      return 'animate-pulse';
  }
}

/**
 * Unified status icon component
 * Replaces emoji icons with consistent SVG icons
 */
/**
 * Get default accessibility label for icon type
 */
function getDefaultAriaLabel(type: StatusIconType): string {
  switch (type) {
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'success':
      return 'Success';
    case 'info':
      return 'Information';
    case 'storage':
      return 'Storage';
    case 'network':
      return 'Network';
    case 'sync':
      return 'Synchronization';
    case 'component':
      return 'Component';
    case 'route':
      return 'Route';
    case 'async':
      return 'Async operation';
    case 'loading':
      return 'Loading';
    case 'offline':
      return 'Offline';
    case 'retry':
      return 'Retry';
    default:
      return 'Status icon';
  }
}

export const StatusIcon = React.forwardRef<SVGSVGElement, StatusIconProps>(({
  type,
  size = 'md',
  color,
  variant,
  className,
  animate = false,
  animation = 'pulse',
  'aria-label': ariaLabel,
  decorative = false,
  title,
  ...props
}, ref) => {
  const iconSize = ErrorUIIcons.size[size];
  const iconColor = getIconColor(variant, color);
  const animationClasses = getAnimationClasses(animate, animation);

  // Accessibility attributes
  const isHidden = decorative;
  const defaultAriaLabel = !isHidden ? (ariaLabel || getDefaultAriaLabel(type)) : undefined;
  const iconTitle = title || defaultAriaLabel;

  return (
    <svg
      ref={ref}
      className={cn(
        'inline-flex',
        animationClasses,
        className
      )}
      style={{
        width: iconSize,
        height: iconSize,
        color: iconColor,
      }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={isHidden}
      aria-label={defaultAriaLabel}
      title={iconTitle}
      role={!isHidden ? 'img' : undefined}
      {...props}
    >
      {iconPaths[type]}
    </svg>
  );
});

StatusIcon.displayName = 'StatusIcon';

/**
 * Predefined icon variants for common use cases
 */
export const ErrorIcon = (props: Omit<StatusIconProps, 'type' | 'variant'>) => (
  <StatusIcon type="error" variant="error" {...props} />
);

export const WarningIcon = (props: Omit<StatusIconProps, 'type' | 'variant'>) => (
  <StatusIcon type="warning" variant="warning" {...props} />
);

export const SuccessIcon = (props: Omit<StatusIconProps, 'type' | 'variant'>) => (
  <StatusIcon type="success" variant="success" {...props} />
);

export const InfoIcon = (props: Omit<StatusIconProps, 'type' | 'variant'>) => (
  <StatusIcon type="info" variant="info" {...props} />
);

export const LoadingIcon = (props: Omit<StatusIconProps, 'type' | 'animate' | 'animation'>) => (
  <StatusIcon type="loading" animate={true} animation="spin" {...props} />
);

export const StorageIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="storage" {...props} />
);

export const NetworkIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="network" {...props} />
);

export const SyncIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="sync" {...props} />
);

export const ComponentIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="component" {...props} />
);

export const RouteIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="route" {...props} />
);

export const AsyncIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="async" {...props} />
);

export const OfflineIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="offline" {...props} />
);

export const RetryIcon = (props: Omit<StatusIconProps, 'type'>) => (
  <StatusIcon type="retry" {...props} />
);