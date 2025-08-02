/**
 * @file testWrappers.tsx
 * @description Common test wrapper components for different testing scenarios
 */

import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { vi } from 'vitest';

// Mock Clerk for testing
const mockClerkPublishableKey = 'pk_test_mock_key_for_testing';

/**
 * Basic wrapper with just Clerk provider
 */
export const ClerkWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ClerkProvider publishableKey={mockClerkPublishableKey}>
    {children}
  </ClerkProvider>
);

/**
 * Router wrapper with BrowserRouter
 */
export const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

/**
 * Memory router wrapper for controlled routing tests
 */
export const MemoryRouterWrapper: React.FC<{ 
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}> = ({ children, initialEntries = ['/'], initialIndex = 0 }) => (
  <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
    {children}
  </MemoryRouter>
);

/**
 * Complete wrapper with all providers (Router + Clerk)
 */
export const AllProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ClerkProvider publishableKey={mockClerkPublishableKey}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ClerkProvider>
);

/**
 * Memory router with all providers
 */
export const AllProvidersMemoryWrapper: React.FC<{ 
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}> = ({ children, initialEntries = ['/'], initialIndex = 0 }) => (
  <ClerkProvider publishableKey={mockClerkPublishableKey}>
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  </ClerkProvider>
);

/**
 * Wrapper factory for creating custom wrappers
 */
export const createTestWrapper = (options: {
  withRouter?: boolean;
  withClerk?: boolean;
  routerType?: 'browser' | 'memory';
  routerOptions?: {
    initialEntries?: string[];
    initialIndex?: number;
  };
} = {}): React.FC<{ children: React.ReactNode }> => {
  const {
    withRouter = false,
    withClerk = false,
    routerType = 'browser',
    routerOptions = {}
  } = options;

  return ({ children }) => {
    let wrapped = <>{children}</>;

    // Add router wrapper
    if (withRouter) {
      if (routerType === 'memory') {
        wrapped = (
          <MemoryRouter 
            initialEntries={routerOptions.initialEntries || ['/']}
            initialIndex={routerOptions.initialIndex || 0}
          >
            {wrapped}
          </MemoryRouter>
        );
      } else {
        wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
      }
    }

    // Add Clerk wrapper
    if (withClerk) {
      wrapped = (
        <ClerkProvider publishableKey={mockClerkPublishableKey}>
          {wrapped}
        </ClerkProvider>
      );
    }

    return wrapped;
  };
};

/**
 * React Router DOM mock utilities
 */
export const createRouterMocks = () => {
  const mockSetSearchParams = vi.fn();
  const mockSearchParams = new URLSearchParams();
  const mockNavigate = vi.fn();

  // Clear search params utility
  const clearSearchParams = () => {
    for (const key of Array.from(mockSearchParams.keys())) {
      mockSearchParams.delete(key);
    }
  };

  return {
    setSearchParams: mockSetSearchParams,
    searchParams: mockSearchParams,
    navigate: mockNavigate,
    clearSearchParams,
    // Mock implementations for react-router-dom
    mocks: {
      useSearchParams: () => [mockSearchParams, mockSetSearchParams],
      useNavigate: () => mockNavigate,
    }
  };
};

/**
 * Hook wrapper for testing custom hooks that need router context
 */
export const createHookWrapper = (wrapperType: 'router' | 'memory' | 'clerk' | 'all' = 'all') => {
  switch (wrapperType) {
    case 'router':
      return RouterWrapper;
    case 'memory':
      return MemoryRouterWrapper;
    case 'clerk':
      return ClerkWrapper;
    case 'all':
    default:
      return AllProvidersWrapper;
  }
};

// Export utility functions from separate file to avoid React refresh warnings
export {
  setupUserEvent,
  createTimerUtils,
  createAsyncUtils,
  createMockUtils,
  createEnvironmentUtils
} from './utils/testUtils';