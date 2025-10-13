/**
 * Permission utilities - all users have access to everything
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
 * Check if user can access members list - all users can access
 */
export const canAccessMembers = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can invite members - all users can invite
 */
export const canInviteMembers = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can access company profile - all users can access
 */
export const canAccessCompanyProfile = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can edit company profile - all users can edit
 */
export const canEditCompanyProfile = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can access subscription page - all users can access
 */
export const canAccessSubscription = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can manage subscription - all users can manage
 */
export const canManageSubscription = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can edit/deactivate other members - all users can manage
 */
export const canManageMembers = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can create projects - all users can create
 */
export const canCreateProjects = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user can access a specific route - all users can access all routes
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
  return user !== null;
};