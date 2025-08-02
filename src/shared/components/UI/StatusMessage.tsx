/**
 * @file StatusMessage.tsx
 * @description Standardized typography hierarchy for error and status messages
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { ErrorUITypography, ErrorUIColors, getTypographyStyles, type ErrorUITypographyKey } from '../../design/errorUITokens';

export interface StatusMessageProps {
  /** Typography variant */
  variant?: ErrorUITypographyKey;
  /** Color variant for semantic coloring */
  colorVariant?: 'error' | 'warning' | 'success' | 'info' | 'neutral';
  /** Custom color override */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Message content */
  children: React.ReactNode;
  /** HTML element type */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** Whether to center text */
  centered?: boolean;
  /** Whether to add margin bottom */
  marginBottom?: boolean;
}

/**
 * Get text color based on color variant
 */
function getTextColor(colorVariant?: 'error' | 'warning' | 'success' | 'info' | 'neutral', customColor?: string): string {
  if (customColor) return customColor;
  
  switch (colorVariant) {
    case 'error':
      return ErrorUIColors.error[800];
    case 'warning':
      return ErrorUIColors.warning[800];
    case 'success':
      return ErrorUIColors.success[800];
    case 'info':
      return ErrorUIColors.info[800];
    case 'neutral':
    default:
      return ErrorUIColors.neutral[700];
  }
}

/**
 * Get appropriate HTML element for typography variant
 */
function getDefaultElement(variant: ErrorUITypographyKey): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' {
  switch (variant) {
    case 'title':
      return 'h1';
    case 'heading':
      return 'h2';
    case 'subheading':
      return 'h3';
    case 'body':
      return 'p';
    case 'caption':
    case 'footnote':
      return 'span';
    case 'code':
      return 'div';
    default:
      return 'p';
  }
}

/**
 * Base status message component with consistent typography
 */
export const StatusMessage = React.forwardRef<HTMLElement, StatusMessageProps>(({
  variant = 'body',
  colorVariant = 'neutral',
  color,
  className,
  children,
  as,
  centered = false,
  marginBottom = false,
  ...props
}, ref) => {
  const Element = as || getDefaultElement(variant);
  const typographyStyles = getTypographyStyles(variant);
  const textColor = getTextColor(colorVariant, color);

  return (
    <Element
      ref={ref as any}
      className={cn(
        // Base styles
        'block',
        
        // Centering
        centered && 'text-center',
        
        // Margin bottom
        marginBottom && 'mb-4',
        
        // Code variant specific styles
        variant === 'code' && 'font-mono bg-gray-100 p-2 rounded border overflow-auto whitespace-pre-wrap',
        
        // Additional classes
        className
      )}
      style={{
        ...typographyStyles,
        color: textColor,
      }}
      {...props}
    >
      {children}
    </Element>
  );
});

StatusMessage.displayName = 'StatusMessage';

/**
 * Predefined message variants for common use cases
 */

/**
 * Error page title (large, prominent)
 */
export const StatusTitle = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'h1',
  colorVariant = 'error',
  centered = true,
  marginBottom = true,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="title"
    as={as}
    colorVariant={colorVariant}
    centered={centered}
    marginBottom={marginBottom}
    {...props}
  />
));

StatusTitle.displayName = 'StatusTitle';

/**
 * Section heading for error categories
 */
export const StatusHeading = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'h2',
  marginBottom = true,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="heading"
    as={as}
    marginBottom={marginBottom}
    {...props}
  />
));

StatusHeading.displayName = 'StatusHeading';

/**
 * Sub-heading for error details
 */
export const StatusSubheading = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'h3',
  marginBottom = true,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="subheading"
    as={as}
    marginBottom={marginBottom}
    {...props}
  />
));

StatusSubheading.displayName = 'StatusSubheading';

/**
 * Primary error description
 */
export const StatusDescription = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'p',
  marginBottom = true,
  centered = true,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="body"
    as={as}
    marginBottom={marginBottom}
    centered={centered}
    {...props}
  />
));

StatusDescription.displayName = 'StatusDescription';

/**
 * Secondary text and hints
 */
export const StatusCaption = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'span',
  colorVariant = 'neutral',
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="caption"
    as={as}
    colorVariant={colorVariant}
    {...props}
  />
));

StatusCaption.displayName = 'StatusCaption';

/**
 * Fine print and timestamps
 */
export const StatusFootnote = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'span',
  colorVariant = 'neutral',
  className,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="footnote"
    as={as}
    colorVariant={colorVariant}
    className={cn('opacity-75', className)}
    {...props}
  />
));

StatusFootnote.displayName = 'StatusFootnote';

/**
 * Code snippets and technical details  
 */
export const StatusCode = React.forwardRef<HTMLElement, Omit<StatusMessageProps, 'variant'>>(({
  as = 'pre',
  colorVariant = 'neutral',
  centered = false,
  ...props
}, ref) => (
  <StatusMessage
    ref={ref}
    variant="code"
    as={as}
    colorVariant={colorVariant}
    centered={centered}
    {...props}
  />
));

StatusCode.displayName = 'StatusCode';

/**
 * Retry counter display
 */
export interface StatusRetryCounterProps extends Omit<StatusMessageProps, 'children' | 'variant'> {
  count: number;
  maxRetries?: number;
}

export const StatusRetryCounter = React.forwardRef<HTMLElement, StatusRetryCounterProps>(({
  count,
  maxRetries,
  colorVariant = 'warning',
  className,
  ...props
}, ref) => (
  <StatusCaption
    ref={ref}
    colorVariant={colorVariant}
    className={cn('inline-flex items-center gap-1', className)}
    {...props}
  >
    <span>Retry attempt: {count}</span>
    {maxRetries && <span className="opacity-60">/ {maxRetries}</span>}
  </StatusCaption>
));

StatusRetryCounter.displayName = 'StatusRetryCounter';

/**
 * Development-only error details
 */
export interface StatusDebugInfoProps extends Omit<StatusMessageProps, 'children' | 'variant'> {
  error?: Error;
  context?: Record<string, any>;
  expanded?: boolean;
}

export const StatusDebugInfo = React.forwardRef<HTMLElement, StatusDebugInfoProps>(({
  error,
  context,
  expanded = false,
  className,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={cn('text-left mt-4', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
      >
        <span className={cn('transition-transform', isExpanded ? 'rotate-90' : 'rotate-0')}>
          ▶
        </span>
        Error details (development only)
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {error && (
            <StatusCode>
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  <strong>Stack trace:</strong>
                  {'\n'}
                  {error.stack}
                </>
              )}
            </StatusCode>
          )}
          
          {context && Object.keys(context).length > 0 && (
            <StatusCode>
              <strong>Context:</strong>
              {'\n'}
              {JSON.stringify(context, null, 2)}
            </StatusCode>
          )}
        </div>
      )}
    </div>
  );
});

StatusDebugInfo.displayName = 'StatusDebugInfo';