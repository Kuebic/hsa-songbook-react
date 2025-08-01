import { vi } from 'vitest'
import { Types } from 'mongoose'
import * as Express from 'express'

/**
 * Clerk Testing Utilities
 * Based on official Clerk testing documentation
 */

// Test user data with fixed OTP codes
export const TEST_USERS = {
  REGULAR_USER: {
    email: 'test+clerk_test@example.com', // Fixed OTP: 424242
    phone: '+15555550100', // Fixed OTP: 424242
    firstName: 'Test',
    lastName: 'User',
    password: 'testpassword123',
  },
  ADMIN_USER: {
    email: 'admin+clerk_test@example.com',
    phone: '+15555550101',
    firstName: 'Admin',
    lastName: 'User',
    password: 'adminpassword123',
  },
  LEADER_USER: {
    email: 'leader+clerk_test@example.com',
    phone: '+15555550102',
    firstName: 'Leader',
    lastName: 'User',
    password: 'leaderpassword123',
  }
}

// Mock session tokens for different user types
export const MOCK_SESSION_TOKENS = {
  REGULAR_USER: 'sess_test_regular_user_token_123',
  ADMIN_USER: 'sess_test_admin_user_token_456',
  LEADER_USER: 'sess_test_leader_user_token_789',
}

// Mock user IDs (as valid ObjectIds for MongoDB)  
export const MOCK_USER_IDS = {
  REGULAR_USER: new Types.ObjectId(),
  ADMIN_USER: new Types.ObjectId(),
  LEADER_USER: new Types.ObjectId(),
}

/**
 * Create a mock Clerk auth object for different user types
 */
export function createMockAuth(userType: 'REGULAR_USER' | 'ADMIN_USER' | 'LEADER_USER' | null = null) {
  if (!userType) {
    return {
      userId: null,
      sessionId: null,
      sessionClaims: null,
      getToken: vi.fn().mockResolvedValue(null),
    }
  }

  const roleMap = {
    REGULAR_USER: 'member',
    ADMIN_USER: 'admin',
    LEADER_USER: 'leader',
  }

  return {
    userId: MOCK_USER_IDS[userType],
    sessionId: MOCK_SESSION_TOKENS[userType],
    sessionClaims: {
      metadata: {
        role: roleMap[userType],
      },
      sub: MOCK_USER_IDS[userType],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    },
    getToken: vi.fn().mockResolvedValue(MOCK_SESSION_TOKENS[userType]),
  }
}

/**
 * Mock Clerk Express middleware with configurable auth state
 */
export function createClerkMocks(defaultUserType: 'REGULAR_USER' | 'ADMIN_USER' | 'LEADER_USER' | null = null) {
  let currentAuthState = createMockAuth(defaultUserType)

  return {
    clerkMiddleware: () => (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      req.auth = currentAuthState
      next()
    },
    requireAuth: () => (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      if (!currentAuthState.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        })
      }
      req.auth = currentAuthState
      next()
    },
    getAuth: () => currentAuthState,
    
    // Helper to change auth state during tests
    setAuthState: (userType: 'REGULAR_USER' | 'ADMIN_USER' | 'LEADER_USER' | null) => {
      currentAuthState = createMockAuth(userType)
    },
    
    // Reset to unauthenticated state
    clearAuth: () => {
      currentAuthState = createMockAuth(null)
    }
  }
}

/**
 * Create authorization header for API requests
 */
export function createAuthHeader(userType: 'REGULAR_USER' | 'ADMIN_USER' | 'LEADER_USER') {
  return {
    'Authorization': `Bearer ${MOCK_SESSION_TOKENS[userType]}`
  }
}

/**
 * Helper to create test request with proper authentication
 */
export function withAuth(request: unknown, userType: 'REGULAR_USER' | 'ADMIN_USER' | 'LEADER_USER') {
  return request.set(createAuthHeader(userType))
}