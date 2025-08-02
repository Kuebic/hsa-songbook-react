/**
 * @file StatusCard.tsx
 * @description Unified base card component for all error/status states
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { ErrorUIColors, ErrorUISpacing, ErrorUIVariants, type ErrorUIVariantKey } from '../../design/errorUITokens';

export interface StatusCardProps {
  /** Visual variant based on status type */
  variant?: 'error' | 'warning' | 'success' | 'info';
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Whether to show border */
  bordered?: boolean;
  /** Whether to add shadow */
  elevated?: boolean;
  /** Custom background color override */
  backgroundColor?: string;
  /** Custom border color override */
  borderColor?: string;
  /** Whether to center content */
  centered?: boolean;
  /** Custom padding override */
  padding?: keyof typeof ErrorUISpacing.padding;
  /** Whether card is interactive (adds hover effects) */
  interactive?: boolean;
  /** Animation preset for entrance */
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  /** Custom animation duration in ms */
  animationDuration?: number;
  /** ARIA role for accessibility */
  role?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA describedby for accessibility */
  'aria-describedby'?: string;
  /** ARIA labelledby for accessibility */
  'aria-labelledby'?: string;
  /** ARIA live region for dynamic content */
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

/**
 * Base card component for consistent error/status UI
 * Provides semantic color variants and consistent spacing
 */
export const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(({
  variant = 'info',
  size = 'md',
  className,
  children,
  bordered = true,
  elevated = false,
  backgroundColor,
  borderColor,
  centered = false,
  padding,
  interactive = false,
  animation = 'fade-in',
  animationDuration = 300,
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby, 
  'aria-labelledby': ariaLabelledby,
  'aria-live': ariaLive,
  ...props
}, ref) => {
  // Get variant colors
  const variantConfig = ErrorUIVariants[variant];
  
  // Size configurations
  const sizeConfigs = {
    sm: {
      maxWidth: '20rem',     // max-w-sm
      padding: ErrorUISpacing.padding.sm,
    },
    md: {
      maxWidth: '28rem',     // max-w-md
      padding: ErrorUISpacing.padding.md,
    },
    lg: {
      maxWidth: '32rem',     // max-w-lg
      padding: ErrorUISpacing.padding.lg,
    },
    xl: {
      maxWidth: '42rem',     // max-w-2xl
      padding: ErrorUISpacing.padding.xl,
    },
    full: {
      maxWidth: '100%',
      padding: ErrorUISpacing.padding.lg,
    },
  };

  const sizeConfig = sizeConfigs[size];
  const cardPadding = padding ? ErrorUISpacing.padding[padding] : sizeConfig.padding;

  // Animation classes
  const animationClasses = {
    'fade-in': 'animate-fadeIn',
    'slide-up': 'animate-slideUp',
    'slide-down': 'animate-slideDown', 
    'scale': 'animate-scaleIn',
    'none': '',
  };

  // Interactive classes
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
    : '';

  // Default accessibility attributes
  const defaultRole = role || (variant === 'error' ? 'alert' : variant === 'warning' ? 'alert' : 'status');
  const defaultAriaLive = ariaLive || (variant === 'error' || variant === 'warning' ? 'assertive' : 'polite');

  return (
    <div
      ref={ref}
      className={cn(
        // Base styles
        'rounded-lg transition-all duration-200',
        
        // Size styles
        size !== 'full' && 'w-full mx-auto',
        
        // Centering
        centered && 'text-center',
        
        // Border styles
        bordered && 'border',
        
        // Shadow styles
        elevated && 'shadow-lg hover:shadow-xl',
        
        // Animation classes
        animation !== 'none' && animationClasses[animation],
        
        // Interactive classes
        interactiveClasses,
        
        // Additional classes
        className
      )}
      role={defaultRole}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-labelledby={ariaLabelledby}
      aria-live={defaultAriaLive}
      tabIndex={interactive ? 0 : undefined}
      style={{
        maxWidth: sizeConfig.maxWidth,
        padding: cardPadding,
        backgroundColor: backgroundColor || variantConfig.backgroundColor,
        borderColor: bordered ? (borderColor || variantConfig.borderColor) : 'transparent',
        color: variantConfig.textColor,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

StatusCard.displayName = 'StatusCard';

/**
 * Compact status card for inline use
 */
export const StatusCardCompact = React.forwardRef<HTMLDivElement, StatusCardProps>(({
  size = 'sm',
  padding = 'sm',
  ...props
}, ref) => (
  <StatusCard
    ref={ref}
    size={size}
    padding={padding}
    {...props}
  />
));

StatusCardCompact.displayName = 'StatusCardCompact';

/**
 * Full-width status card for page-level errors
 */
export const StatusCardFullPage = React.forwardRef<HTMLDivElement, StatusCardProps>(({
  size = 'full',
  centered = true,
  elevated = false,
  className,
  ...props
}, ref) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <StatusCard
      ref={ref}
      size={size}
      centered={centered}
      elevated={elevated}
      className={cn('max-w-2xl', className)}
      {...props}
    />
  </div>
));

StatusCardFullPage.displayName = 'StatusCardFullPage';

/**
 * Status card with subtle styling for non-critical messages
 */
export const StatusCardSubtle = React.forwardRef<HTMLDivElement, StatusCardProps>(({
  bordered = false,
  elevated = false,
  ...props
}, ref) => (
  <StatusCard
    ref={ref}
    bordered={bordered}
    elevated={elevated}
    {...props}
  />
));

StatusCardSubtle.displayName = 'StatusCardSubtle';