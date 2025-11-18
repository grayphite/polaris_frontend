import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listProjectMembers } from '../services/projectMemberService';
import { getUserProjectRole, ProjectRole } from '../utils/permissions';

/**
 * Cache key format: `${userId}:${projectId}`
 * This ensures roles are scoped per user, preventing cross-user cache contamination
 */
type CacheKey = string;

// Module-level cache to store roles per user+project combination
const roleCache = new Map<CacheKey, { role: ProjectRole | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for a user and project combination
 */
const getCacheKey = (userId: string | null, projectId: string | null): CacheKey | null => {
  if (!userId || !projectId) return null;
  return `${userId}:${projectId}`;
};

/**
 * Clear all cached roles - called when user logs out or switches accounts
 */
export const clearProjectRoleCache = (): void => {
  roleCache.clear();
};

/**
 * Clear cached role for a specific user+project combination
 */
export const clearProjectRoleCacheForUser = (userId: string): void => {
  const keysToDelete: CacheKey[] = [];
  roleCache.forEach((_, key) => {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => roleCache.delete(key));
};

/**
 * Hook to get the current user's role in a specific project
 * 
 * Features:
 * - Caches role per user+project combination to avoid repeated API calls
 * - Automatically clears cache when user changes (login/logout/account switch)
 * - Returns isLoading=true until role is fetched (safe default for UI)
 * - Defaults to null role until fetched (prevents showing privileged UI incorrectly)
 * 
 * @example
 * ```tsx
 * const { role, isLoading } = useProjectRole(projectId);
 * 
 * // Safe default: don't show privileged controls until role is loaded
 * if (isLoading) return <Loader />;
 * 
 * // Only show for owner or editor
 * {(role === 'owner' || role === 'editor') && <CreateChatButton />}
 * ```
 */
export const useProjectRole = (projectId: string | null | undefined): {
  role: ProjectRole | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
} => {
  const { user } = useAuth();
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track previous user ID to detect user changes (login/logout/switch)
  const prevUserIdRef = useRef<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!projectId || !user?.id) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const cacheKey = getCacheKey(user.id, projectId);
    if (!cacheKey) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // Check cache first (scoped to current user)
    const cached = roleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setRole(cached.role);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all members (we might need pagination, but for role check, first page should suffice)
      const response = await listProjectMembers(projectId, 1, 100);
      const userRole = getUserProjectRole(user, response.members);
      
      // Cache the result with user-scoped key
      roleCache.set(cacheKey, { role: userRole, timestamp: Date.now() });
      setRole(userRole);
    } catch (error) {
      console.error('Failed to fetch project role:', error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user]);

  // Clear cache when user changes (login, logout, or account switch)
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    // If user ID changed, clear cache for the previous user
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId) {
      clearProjectRoleCacheForUser(prevUserIdRef.current);
    }
    
    // If user logged out (currentUserId is null), clear all cache
    if (prevUserIdRef.current !== null && currentUserId === null) {
      clearProjectRoleCache();
    }
    
    prevUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Fetch role when projectId or user changes
  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const refetch = useCallback(async () => {
    if (projectId && user?.id) {
      const cacheKey = getCacheKey(user.id, projectId);
      if (cacheKey) {
        roleCache.delete(cacheKey); // Clear cache for this user+project
      }
    }
    await fetchRole();
  }, [projectId, user?.id, fetchRole]);

  return { role, isLoading, refetch };
};

