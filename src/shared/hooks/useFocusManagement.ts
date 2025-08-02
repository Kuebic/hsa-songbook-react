/**
 * @file useFocusManagement.ts
 * @description Hook for managing focus in error UI components for accessibility
 */

import { useEffect, useRef, useCallback } from 'react';

export interface FocusManagementOptions {
  /** Whether to auto-focus the primary action on mount */
  autoFocusPrimary?: boolean;
  /** Whether to trap focus within the component */
  trapFocus?: boolean;
  /** Whether to return focus to the triggering element on unmount */
  returnFocus?: boolean;
  /** Element that triggered the error (for focus restoration) */
  triggerElement?: HTMLElement | null;
  /** Delay before auto-focusing in ms */
  focusDelay?: number;
}

export interface FocusManagementReturn {
  /** Ref for the container element */
  containerRef: React.RefObject<HTMLElement>;
  /** Ref for the primary action button */
  primaryActionRef: React.RefObject<HTMLButtonElement>;
  /** Function to focus the primary action */
  focusPrimaryAction: () => void;
  /** Function to focus the first focusable element */
  focusFirst: () => void;
  /** Function to focus the last focusable element */
  focusLast: () => void;
  /** Handle keydown events for focus management */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

const FOCUSABLE_SELECTOR = 
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook for managing focus in error recovery components
 */
export function useFocusManagement(options: FocusManagementOptions = {}): FocusManagementReturn {
  const {
    autoFocusPrimary = true,
    trapFocus = false,
    returnFocus = true,
    triggerElement,
    focusDelay = 100
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(triggerElement || null);

  // Store the originally focused element
  useEffect(() => {
    if (returnFocus && !triggerElementRef.current) {
      triggerElementRef.current = document.activeElement as HTMLElement;
    }
  }, [returnFocus]);

  // Auto-focus the primary action
  useEffect(() => {
    if (autoFocusPrimary && primaryActionRef.current) {
      const timer = setTimeout(() => {
        primaryActionRef.current?.focus();
      }, focusDelay);

      return () => clearTimeout(timer);
    }
  }, [autoFocusPrimary, focusDelay]);

  // Return focus on unmount
  useEffect(() => {
    return () => {
      if (returnFocus && triggerElementRef.current) {
        // Use a small delay to ensure the component is unmounted
        setTimeout(() => {
          if (triggerElementRef.current && document.contains(triggerElementRef.current)) {
            triggerElementRef.current.focus();
          }
        }, 0);
      }
    };
  }, [returnFocus]);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
  }, []);

  const focusPrimaryAction = useCallback(() => {
    primaryActionRef.current?.focus();
  }, []);

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    focusableElements[focusableElements.length - 1]?.focus();
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!trapFocus) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Tab':
        if (event.shiftKey) {
          // Shift + Tab (backward)
          if (currentIndex <= 0) {
            event.preventDefault();
            focusLast();
          }
        } else {
          // Tab (forward)
          if (currentIndex >= focusableElements.length - 1) {
            event.preventDefault();
            focusFirst();
          }
        }
        break;

      case 'Escape':
        // Allow components to handle escape
        break;

      case 'Home':
        event.preventDefault();
        focusFirst();
        break;

      case 'End':
        event.preventDefault();
        focusLast();
        break;
    }
  }, [trapFocus, getFocusableElements, focusFirst, focusLast]);

  return {
    containerRef,
    primaryActionRef,
    focusPrimaryAction,
    focusFirst,
    focusLast,
    handleKeyDown
  };
}

/**
 * Hook specifically for error boundary focus management
 */
export function useErrorBoundaryFocus(options: FocusManagementOptions = {}) {
  return useFocusManagement({
    autoFocusPrimary: true,
    trapFocus: true,
    returnFocus: true,
    focusDelay: 150,
    ...options
  });
}

/**
 * Hook for status notification focus management  
 */
export function useStatusNotificationFocus(options: FocusManagementOptions = {}) {
  return useFocusManagement({
    autoFocusPrimary: false,
    trapFocus: false,
    returnFocus: false,
    ...options
  });
}