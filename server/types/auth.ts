/**
 * @file auth.ts
 * @description Authentication and authorization type definitions
 */

import { Request } from 'express';

/**
 * User roles enumeration for consistent role management
 */
export enum Role {
  USER = 'user',
  MODERATOR = 'moderator',
  LEADER = 'leader',
  ADMIN = 'admin'
}

/**
 * Role hierarchy for permission checking
 * Higher index = higher privileges
 */
export const ROLE_HIERARCHY: Role[] = [
  Role.USER,
  Role.MODERATOR,
  Role.LEADER,
  Role.ADMIN
];

/**
 * Check if a user role has permission for a required role
 * @param userRole - The user's current role
 * @param requiredRole - The role required for access
 * @returns true if user has sufficient privileges
 */
export function hasRolePermission(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  return userIndex >= requiredIndex;
}

/**
 * Session claims interface for Clerk authentication
 */
export interface SessionClaims {
  metadata?: {
    role?: Role;
  };
  [key: string]: unknown;
}

/**
 * Extended request interface with authentication data
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionClaims?: SessionClaims;
    role?: Role;
  };
}

/**
 * Clerk webhook event types
 */
export enum ClerkWebhookEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  SESSION_CREATED = 'session.created',
  SESSION_ENDED = 'session.ended'
}

/**
 * Clerk user data from webhook
 */
export interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    verification: {
      status: string;
    };
  }>;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_image_url?: string;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
  unsafe_metadata?: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

/**
 * Clerk webhook payload
 */
export interface ClerkWebhookPayload {
  data: ClerkUserData;
  object: string;
  type: ClerkWebhookEvent;
}