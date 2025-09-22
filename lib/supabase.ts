// Re-export everything from utils for backward compatibility
export * from '../utils/prisma';

// Legacy exports for compatibility
export { db as supabase } from '../utils/prisma';