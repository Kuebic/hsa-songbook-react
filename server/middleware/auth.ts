import { Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { Role, AuthenticatedRequest, hasRolePermission } from '../types/auth';

/**
 * Middleware to require authentication
 * Adds auth info to request object if valid
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  req.auth = {
    userId: auth.userId,
    sessionClaims: auth.sessionClaims,
    role: (auth.sessionClaims?.metadata?.role as Role) || Role.USER
  };

  next();
};

/**
 * Middleware to optionally add auth info if present
 * Does not require authentication, but adds auth data if available
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  
  if (auth.userId) {
    req.auth = {
      userId: auth.userId,
      sessionClaims: auth.sessionClaims
    };
  }

  next();
};

/**
 * Middleware to require specific role
 */
export const requireRole = (requiredRole: Role) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    
    if (!auth.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = (auth.sessionClaims?.metadata?.role as Role) || Role.USER;
    
    if (!hasRolePermission(userRole, requiredRole)) {
      return res.status(403).json({
        error: `${requiredRole} role required`,
        code: 'FORBIDDEN'
      });
    }

    req.auth = {
      userId: auth.userId,
      sessionClaims: auth.sessionClaims,
      role: userRole
    };

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * Middleware to require leader role or higher
 */
export const requireLeader = requireRole(Role.LEADER);