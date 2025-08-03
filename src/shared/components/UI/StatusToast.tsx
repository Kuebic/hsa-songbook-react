/**
 * @file StatusToast.tsx
 * @description Toast notification system to replace browser alert() calls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { StatusIcon } from './StatusIcon';
import { StatusMessage } from './StatusMessage';
import { Button } from './Button';
import { ErrorUIAnimations, ErrorUIColors, ErrorUISpacing } from '../../design/errorUITokens';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ToastOptions {
  /** Toast variant */
  variant?: 'error' | 'warning' | 'success' | 'info';
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Whether the toast can be dismissed manually */
  dismissible?: boolean;
  /** Toast position */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Action buttons */
  actions?: ToastAction[];
  /** Custom icon */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether to show default icon */
  showIcon?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

export interface Toast extends ToastOptions {
  id: string;
  title: string;
  message?: string;
  timestamp: number;
}

// Toast context and provider
interface ToastContextValue {
  toasts: Toast[];
  addToast: (title: string, message?: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast functionality
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Individual toast component
 */
const ToastItem = React.forwardRef<HTMLDivElement, Toast & { onRemove: (id: string) => void }>(({
  id,
  title,
  message,
  variant = 'info',
  duration = 5000,
  dismissible = true,
  actions = [],
  icon: CustomIcon,
  showIcon = true,
  className,
  onDismiss,
  onRemove,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    if (!dismissible) return;
    
    setIsExiting(true);
    
    // Wait for exit animation
    setTimeout(() => {
      onRemove(id);
      onDismiss?.();
    }, 200);
  }, [id, dismissible, onRemove, onDismiss]);

  const variantConfig = {
    error: {
      backgroundColor: ErrorUIColors.error[50],
      borderColor: ErrorUIColors.error[200],
      iconColor: ErrorUIColors.error[600],
    },
    warning: {
      backgroundColor: ErrorUIColors.warning[50],
      borderColor: ErrorUIColors.warning[200],
      iconColor: ErrorUIColors.warning[600],
    },
    success: {
      backgroundColor: ErrorUIColors.success[50],
      borderColor: ErrorUIColors.success[200],
      iconColor: ErrorUIColors.success[600],
    },
    info: {
      backgroundColor: ErrorUIColors.info[50],
      borderColor: ErrorUIColors.info[200],
      iconColor: ErrorUIColors.info[600],
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      ref={ref}
      className={cn(
        // Base styles
        'relative flex items-start p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'transition-all duration-200 ease-out transform',
        
        // Animation states
        isVisible && !isExiting && 'translate-x-0 opacity-100',
        !isVisible && 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0 scale-95',
        
        // Max width
        'max-w-sm w-full',
        
        // Custom classes
        className
      )}
      style={{
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      }}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {/* Icon */}
      {showIcon && (
        <div className="flex-shrink-0 mr-3">
          {CustomIcon ? (
            <CustomIcon className="w-5 h-5" />
          ) : (
            <StatusIcon
              type={variant}
              variant={variant}
              size="sm"
              color={config.iconColor}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-grow min-w-0">
        <StatusMessage
          variant="caption"
          colorVariant={variant}
          as="div"
          className="font-medium"
        >
          {title}
        </StatusMessage>
        
        {message && (
          <StatusMessage
            variant="footnote"
            colorVariant="neutral"
            as="div"
            className="mt-1"
          >
            {message}
          </StatusMessage>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="xs"
                onClick={() => {
                  action.onClick();
                  handleDismiss();
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

/**
 * Toast container component
 */
export const ToastContainer = React.forwardRef<HTMLDivElement, {
  position?: ToastOptions['position'];
  className?: string;
}>(({
  position = 'top-right',
  className,
  ...props
}, ref) => {
  const { toasts, removeToast } = useToast();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position],
        className
      )}
      {...props}
    >
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

/**
 * Toast provider component
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, message?: string, options: ToastOptions = {}): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = {
      id,
      title,
      message,
      timestamp: Date.now(),
      ...options,
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Utility functions to replace alert() calls
 */

/**
 * Show error toast
 */
export function showErrorToast(title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) {
  // This will be used via context when provider is available
  console.error(`[Toast] ${title}${message ? `: ${message}` : ''}`);
  
  // Fallback to alert if no toast provider (backwards compatibility)
  if (typeof window !== 'undefined' && !document.querySelector('[data-toast-provider]')) {
    window.alert(`Error: ${title}${message ? `\n${message}` : ''}`);
  }
}

/**
 * Show warning toast
 */
export function showWarningToast(title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) {
  console.warn(`[Toast] ${title}${message ? `: ${message}` : ''}`);
  
  if (typeof window !== 'undefined' && !document.querySelector('[data-toast-provider]')) {
    window.alert(`Warning: ${title}${message ? `\n${message}` : ''}`);
  }
}

/**
 * Show success toast
 */
export function showSuccessToast(title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) {
  console.log(`[Toast] ${title}${message ? `: ${message}` : ''}`);
  
  if (typeof window !== 'undefined' && !document.querySelector('[data-toast-provider]')) {
    window.alert(`Success: ${title}${message ? `\n${message}` : ''}`);
  }
}

/**
 * Show info toast
 */
export function showInfoToast(title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) {
  console.info(`[Toast] ${title}${message ? `: ${message}` : ''}`);
  
  if (typeof window !== 'undefined' && !document.querySelector('[data-toast-provider]')) {
    window.alert(`Info: ${title}${message ? `\n${message}` : ''}`);
  }
}

/**
 * Hook-based toast functions (for use within components)
 */
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    showError: (title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, message, { ...options, variant: 'error' }),
    
    showWarning: (title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, message, { ...options, variant: 'warning' }),
    
    showSuccess: (title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, message, { ...options, variant: 'success' }),
    
    showInfo: (title: string, message?: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, message, { ...options, variant: 'info' }),
  };
}

// Export aliases for backwards compatibility
export const showError = showErrorToast;
export const showWarning = showWarningToast;
export const showSuccess = showSuccessToast;
export const showInfo = showInfoToast;
