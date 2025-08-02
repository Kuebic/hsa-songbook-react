import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, requireRole, requireAdmin, requireLeader } from '../auth';
import { Role, AuthenticatedRequest } from '../../types/auth';

// Mock Clerk
vi.mock('@clerk/express', () => ({
  getAuth: vi.fn()
}));

import { getAuth } from '@clerk/express';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockGetAuth: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
    mockGetAuth = getAuth as ReturnType<typeof vi.fn>;
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should add auth info to request when user is authenticated', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.USER }
        }
      });

      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth).toEqual({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.USER }
        },
        role: Role.USER
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockGetAuth.mockReturnValue({
        userId: null
      });

      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should default to USER role when no role in session claims', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {}
      });

      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth?.role).toBe(Role.USER);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing session claims', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123'
      });

      requireAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth?.role).toBe(Role.USER);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should add auth info when user is authenticated', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.MODERATOR }
        }
      });

      optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth).toEqual({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.MODERATOR }
        }
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without auth info when user is not authenticated', () => {
      mockGetAuth.mockReturnValue({
        userId: null
      });

      optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.ADMIN }
        }
      });

      const middleware = requireRole(Role.MODERATOR);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth).toEqual({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.ADMIN }
        },
        role: Role.ADMIN
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has higher role than required', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.LEADER }
        }
      });

      const middleware = requireRole(Role.USER);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user has insufficient role', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.USER }
        }
      });

      const middleware = requireRole(Role.ADMIN);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: `${Role.ADMIN} role required`,
        code: 'FORBIDDEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockGetAuth.mockReturnValue({
        userId: null
      });

      const middleware = requireRole(Role.USER);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should default to USER role when no role in session claims', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {}
      });

      const middleware = requireRole(Role.USER);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.auth?.role).toBe(Role.USER);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.ADMIN }
        }
      });

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.LEADER }
        }
      });

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: `${Role.ADMIN} role required`,
        code: 'FORBIDDEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireLeader', () => {
    it('should allow access for leader users', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.LEADER }
        }
      });

      requireLeader(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access for admin users (higher than leader)', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.ADMIN }
        }
      });

      requireLeader(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for moderator users', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.MODERATOR }
        }
      });

      requireLeader(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: `${Role.LEADER} role required`,
        code: 'FORBIDDEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for regular users', () => {
      mockGetAuth.mockReturnValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: Role.USER }
        }
      });

      requireLeader(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role hierarchy validation', () => {
    const testCases = [
      { userRole: Role.USER, requiredRole: Role.USER, shouldPass: true },
      { userRole: Role.USER, requiredRole: Role.MODERATOR, shouldPass: false },
      { userRole: Role.MODERATOR, requiredRole: Role.USER, shouldPass: true },
      { userRole: Role.MODERATOR, requiredRole: Role.MODERATOR, shouldPass: true },
      { userRole: Role.MODERATOR, requiredRole: Role.LEADER, shouldPass: false },
      { userRole: Role.LEADER, requiredRole: Role.MODERATOR, shouldPass: true },
      { userRole: Role.LEADER, requiredRole: Role.LEADER, shouldPass: true },
      { userRole: Role.LEADER, requiredRole: Role.ADMIN, shouldPass: false },
      { userRole: Role.ADMIN, requiredRole: Role.USER, shouldPass: true },
      { userRole: Role.ADMIN, requiredRole: Role.MODERATOR, shouldPass: true },
      { userRole: Role.ADMIN, requiredRole: Role.LEADER, shouldPass: true },
      { userRole: Role.ADMIN, requiredRole: Role.ADMIN, shouldPass: true }
    ];

    testCases.forEach(({ userRole, requiredRole, shouldPass }) => {
      it(`should ${shouldPass ? 'allow' : 'deny'} ${userRole} accessing ${requiredRole} endpoint`, () => {
        mockGetAuth.mockReturnValue({
          userId: 'user_123',
          sessionClaims: {
            metadata: { role: userRole }
          }
        });

        const middleware = requireRole(requiredRole);
        middleware(
          mockRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        if (shouldPass) {
          expect(mockNext).toHaveBeenCalled();
          expect(mockResponse.status).not.toHaveBeenCalled();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(403);
          expect(mockNext).not.toHaveBeenCalled();
        }
      });
    });
  });
});