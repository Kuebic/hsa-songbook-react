import { ReactNode } from 'react';
import { useUser, Role } from '../../../hooks/useUser';

interface RoleGuardProps {
  children: ReactNode;
  role: Role;
  fallback?: ReactNode;
  requireExact?: boolean;
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGuard({ 
  children, 
  role, 
  fallback = null, 
  requireExact = false 
}: RoleGuardProps) {
  const { user, isLoaded } = useUser();

  // Don't render anything while loading
  if (!isLoaded) {
    return null;
  }

  // If user is not authenticated, show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // Check permissions
  const hasPermission = requireExact 
    ? user.role === role 
    : user.hasRole(role);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Predefined role guard components for common use cases
 */
export const ModeratorGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard role={Role.MODERATOR} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const LeaderGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard role={Role.LEADER} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard role={Role.ADMIN} fallback={fallback}>
    {children}
  </RoleGuard>
);