/**
 * Permission utilities for role-based access control
 */

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user is a member
 */
export const isMember = (user: User | null): boolean => {
  return user?.role === 'member';
};

/**
 * Check if user can access members list
 */
export const canAccessMembers = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can invite members
 */
export const canInviteMembers = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can access company profile
 */
export const canAccessCompanyProfile = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can edit company profile
 */
export const canEditCompanyProfile = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can access subscription page
 */
export const canAccessSubscription = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage subscription (change plans, cancel, etc.)
 */
export const canManageSubscription = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can edit/deactivate other members
 */
export const canManageMembers = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can create projects
 */
export const canCreateProjects = (user: User | null): boolean => {
  // Both admin and member can create projects
  return user !== null;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
  // Admin can access everything
  if (isAdmin(user)) {
    return true;
  }

  // Member restrictions
  const restrictedRoutes = [
    '/members',
    '/company-profile',
    '/subscription'
  ];

  return !restrictedRoutes.some(restrictedRoute => route.startsWith(restrictedRoute));
};

