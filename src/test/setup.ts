import '@testing-library/jest-dom'
import { vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock environment variables for Clerk
process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing'

// Mock storage quota API for testing
Object.defineProperty(navigator, 'storage', {
  writable: true,
  value: {
    estimate: vi.fn().mockResolvedValue({
      quota: 1024 * 1024 * 100, // 100MB
      usage: 1024 * 1024 * 10,  // 10MB
    }),
  },
})

// Mock service worker for PWA testing
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ready: Promise.resolve({
        installing: null,
        waiting: null,
        active: {
          postMessage: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

// Mock Clerk for testing environment
vi.mock('@clerk/clerk-react', async () => {
  const actual = await vi.importActual('@clerk/clerk-react')
  return {
    ...actual,
    useAuth: () => ({
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: vi.fn(),
    }),
    useUser: () => ({
      user: null,
      isLoaded: true,
    }),
    SignedIn: ({ children }: { children: React.ReactNode }) => children,
    SignedOut: ({ children }: { children: React.ReactNode }) => children,
    SignInButton: ({ children }: { children: React.ReactNode }) => children,
    SignUpButton: ({ children }: { children: React.ReactNode }) => children,
    UserButton: () => null,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})