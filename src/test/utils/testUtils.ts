/**
 * @file testUtils.ts
 * @description Test utility functions (non-component exports)
 */

import { vi } from 'vitest';

/**
 * User event setup helper
 */
export const setupUserEvent = async () => {
  const userEvent = await import('@testing-library/user-event');
  return userEvent.default.setup({ advanceTimers: vi.advanceTimersByTime });
};

/**
 * Timer utilities for testing
 */
export const createTimerUtils = () => ({
  useFakeTimers: () => vi.useFakeTimers(),
  useRealTimers: () => vi.useRealTimers(),
  advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
  runAllTimers: () => vi.runAllTimers(),
});

/**
 * Async utilities for testing
 */
export const createAsyncUtils = async () => {
  const rtl = await import('@testing-library/react');
  return {
    waitFor: rtl.waitFor,
    act: rtl.act,
    flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),
  };
};

/**
 * Mock cleanup utilities
 */
export const createMockUtils = () => ({
  clearAllMocks: () => vi.clearAllMocks(),
  resetAllMocks: () => vi.resetAllMocks(),
  restoreAllMocks: () => vi.restoreAllMocks(),
});

/**
 * Environment utilities for testing
 */
export const createEnvironmentUtils = () => ({
  setUserAgent: (userAgent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: userAgent,
      configurable: true,
    });
  },
  
  setViewport: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },
  
  setLocalStorage: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  
  clearLocalStorage: () => {
    localStorage.clear();
  },
});