import { useUser as useClerkUser } from '@clerk/clerk-react';
import { useMemo } from 'react';

/**
 * User roles enumeration matching server-side definitions
 */
export const Role = {
  USER: 'user',
  MODERATOR: 'moderator', 
  LEADER: 'leader',
  ADMIN: 'admin'
} as const;

export type Role = typeof Role[keyof typeof Role];

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Role[] = [
  Role.USER,
  Role.MODERATOR,
  Role.LEADER,
  Role.ADMIN
];

/**
 * Check if a user role has permission for a required role
 */
export function hasRolePermission(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  return userIndex >= requiredIndex;
}

/**
 * Enhanced user hook with role-based permissions
 */
export function useUser() {
  const { user, isLoaded, isSignedIn } = useClerkUser();

  const enhancedUser = useMemo(() => {
    if (!user || !isSignedIn) {
      return null;
    }

    const role = (user.publicMetadata?.role as Role) || Role.USER;

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: user.fullName || user.firstName || 'Anonymous User',
      role,
      avatar: user.imageUrl,
      createdAt: user.createdAt,
      lastActiveAt: (user as any).lastActiveAt ?? user.createdAt,
      
      // Permission helpers
      hasRole: (requiredRole: Role) => hasRolePermission(role, requiredRole),
      isUser: role === Role.USER,
      isModerator: hasRolePermission(role, Role.MODERATOR),
      isLeader: hasRolePermission(role, Role.LEADER),
      isAdmin: hasRolePermission(role, Role.ADMIN),
      
      // Convenience permissions
      canModerate: hasRolePermission(role, Role.MODERATOR),
      canLead: hasRolePermission(role, Role.LEADER),
      canAdmin: hasRolePermission(role, Role.ADMIN),
    };
  }, [user, isSignedIn]);

  return {
    user: enhancedUser,
    isLoaded,
    isSignedIn: isSignedIn && !!enhancedUser,
  };
}