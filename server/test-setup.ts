// Global test setup for server tests
import { jest } from '@jest/globals';
import * as Express from 'express';

// Mock Clerk authentication
jest.mock('@clerk/express', () => ({
  ClerkExpressWithAuth: jest.fn(() => (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    // Mock auth data - can be overridden in individual tests
    req.auth = {
      userId: null,
      sessionClaims: null
    };
    next();
  }),
  getAuth: jest.fn((req: Express.Request) => {
    return req.auth || { userId: null, sessionClaims: null };
  })
}));

// Increase test timeout for database operations
jest.setTimeout(30000);