// Legacy compatibility layer - re-exports from Prisma-based system
export * from './prisma';
export { prisma as supabase } from './prisma';

// For backward compatibility with existing imports
export const authHelpers = {
  isAuthenticated: () => Promise.resolve(false),
  getCurrentUser: () => Promise.resolve({ data: { user: null } }),
  signOut: () => Promise.resolve({ error: null }),
  refreshSession: () => Promise.resolve({ data: null, error: null }),
};

export const dbHelpers = {
  // Legacy helper functions - use Prisma directly instead
};

export default { auth: authHelpers };