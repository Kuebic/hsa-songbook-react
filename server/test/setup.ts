import { vi } from 'vitest'
import dotenv from 'dotenv'
import * as Express from 'express'
import { createClerkMocks } from './clerk-helpers.js'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Mock Clerk environment variables for server tests
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing'
process.env.CLERK_SECRET_KEY = 'sk_test_mock_secret_key_for_testing'

// Create Clerk mocks with proper testing patterns
const clerkMocks = createClerkMocks()

// Mock Clerk Express middleware
vi.mock('@clerk/express', () => clerkMocks)

// Disable rate limiting for tests - must be hoisted
vi.mock('express-rate-limit', () => {
  return {
    default: () => (_req: Express.Request, _res: Express.Response, next: Express.NextFunction) => next(),
    __esModule: true,
  }
})

// Export clerk mocks for use in tests
export { clerkMocks }