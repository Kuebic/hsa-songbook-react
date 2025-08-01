import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionClaims?: Record<string, unknown>;
  };
}

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
    sessionClaims: auth.sessionClaims
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
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    
    if (!auth.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = auth.sessionClaims?.metadata?.role || 'member';
    
    if (userRole !== role && userRole !== 'admin') {
      return res.status(403).json({
        error: `${role} role required`,
        code: 'FORBIDDEN'
      });
    }

    req.auth = {
      userId: auth.userId,
      sessionClaims: auth.sessionClaims
    };

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to require leader role or higher
 */
export const requireLeader = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  const userRole = auth.sessionClaims?.metadata?.role || 'member';
  const allowedRoles = ['leader', 'admin'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Leader role or higher required',
      code: 'FORBIDDEN'
    });
  }

  req.auth = {
    userId: auth.userId,
    sessionClaims: auth.sessionClaims
  };

  next();
};