import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for Clerk
process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing'

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